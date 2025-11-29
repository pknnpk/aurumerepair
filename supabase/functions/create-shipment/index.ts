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

        // Mock Shipnity API Call
        // In a real scenario, we would call Shipnity API here.
        // For now, we generate a mock tracking number.
        const mockTrackingNumber = `TH${Math.floor(Math.random() * 1000000000)}XX`;

        // Update Repair Record with Tracking Number
        const { error } = await supabase
            .from("repairs")
            .update({
                tracking_number: mockTrackingNumber,
                status: "ready_to_ship" // Auto-update status to ready_to_ship
            })
            .eq("id", repairId);

        if (error) throw error;

        return new Response(JSON.stringify({ trackingNumber: mockTrackingNumber }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error creating shipment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
