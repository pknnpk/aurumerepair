import { createClient } from "supabase";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { repairId } = await req.json();

        if (!repairId) {
            throw new Error("Missing repairId");
        }

        // 1. Fetch Repair Details
        const { data: repair, error: repairError } = await supabase
            .from("repairs")
            .select("*")
            .eq("id", repairId)
            .single();

        if (repairError || !repair) {
            throw new Error("Repair not found");
        }

        // 2. Calculate Amounts
        const costExternal = repair.cost_external || 0;
        const shippingCost = repair.return_method === "mail" ? 100 : 0; // Fixed 100 THB for mail
        const totalAmount = costExternal + shippingCost; // Net amount

        // 3. Prepare Beam Payload
        const orderItems = [
            {
                description: "Repair Service",
                imageUrl: repair.items?.[0]?.images?.[0] || "", // Use first image of first item if available
                itemName: `Repair Ticket #${repair.id.slice(0, 8)}`,
                price: costExternal * 100, // Beam uses Satang (x100) ? Wait, user example said 1000000 for 1000000?
                // User example: "price": 1000000. If that's 10,000.00 THB, then it's x100.
                // If it's 1,000,000 THB, then it's x1.
                // Standard payment gateways usually use smallest currency unit (Satang).
                // Let's assume Satang (x100) unless user example implies otherwise.
                // User example: "netAmount": 1000000. "price": 1000000.
                // If price is 1000000, is that 10,000 THB?
                // Let's assume x100 for now as is standard.
                productId: repair.id,
                quantity: 1,
                sku: `ARR${repair.id.slice(0, 8)}`
            }
        ];

        if (shippingCost > 0) {
            orderItems.push({
                description: "Shipping Fee",
                imageUrl: "",
                itemName: "EMS / Delivery",
                price: shippingCost * 100,
                productId: "SHIPPING",
                quantity: 1,
                sku: "SHIP001"
            });
        }

        // Recalculate netAmount based on items to be safe
        const netAmount = orderItems.reduce((sum, item) => sum + item.price, 0);

        const beamPayload = {
            linkSettings: {
                qrPromptPay: {
                    isEnabled: true
                }
            },
            order: {
                currency: "THB",
                description: `Repair Service for Ticket #${repair.id.slice(0, 8)}`,
                internalNote: `Repair ID: ${repair.id}`,
                netAmount: netAmount,
                orderItems: orderItems,
                referenceId: repair.id
            },
            redirectUrl: `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000"}/repair/history`
        };

        // 4. Call Beam API
        const beamUser = Deno.env.get("BEAM_API_USER");
        const beamPass = Deno.env.get("BEAM_API_PASSWORD");

        if (!beamUser || !beamPass) {
            throw new Error("Missing BEAM_API_USER or BEAM_API_PASSWORD");
        }

        const authHeader = `Basic ${btoa(`${beamUser}:${beamPass}`)}`;

        const response = await fetch("https://api.beamcheckout.com/api/v1/payment-links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader
            },
            body: JSON.stringify(beamPayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Beam API Error:", result);
            throw new Error(`Beam API Failed: ${JSON.stringify(result)}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error creating payment link:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
