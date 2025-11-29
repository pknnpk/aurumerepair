import { createClient } from "supabase";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RepairStatus =
    | "pending_check"
    | "pending_send"
    | "repairing"
    | "repair_done"
    | "pending_payment"
    | "ready_to_ship"
    | "completed";

interface NotifyRepairUpdateRequest {
    repairId: string;
    newStatus: RepairStatus;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { repairId, newStatus } = await req.json() as NotifyRepairUpdateRequest;
        const channelAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

        if (!channelAccessToken) {
            throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN");
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch repair and customer info
        const { data: repair, error } = await supabase
            .from("repairs")
            .select("*, profiles:customer_id(line_user_id, first_name)")
            .eq("id", repairId)
            .single();

        if (error || !repair || !repair.profiles?.line_user_id) {
            console.error("Repair or Customer not found:", error);
            return new Response(JSON.stringify({ error: "Repair or Customer not found" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const lineUserId = repair.profiles.line_user_id;
        const statusLabel: Record<RepairStatus, string> = {
            pending_check: "รอเช็ค",
            pending_send: "รอส่ง",
            repairing: "กำลังซ่อม",
            repair_done: "ซ่อมเสร็จ",
            pending_payment: "รอชำระ",
            ready_to_ship: "พร้อมส่ง",
            completed: "เสร็จสิ้น",
        };
        const statusText = statusLabel[newStatus];

        // Send LINE Push Message
        const message = {
            to: lineUserId,
            messages: [
                {
                    type: "text",
                    text: `สถานะการซ่อมของคุณเปลี่ยนเป็น: ${statusText}`,
                },
                {
                    type: "flex",
                    altText: "สถานะการซ่อมอัพเดท",
                    contents: {
                        type: "bubble",
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "สถานะการซ่อม",
                                    weight: "bold",
                                    size: "xl",
                                    color: "#00B900"
                                },
                                {
                                    type: "text",
                                    text: `รหัสใบซ่อม: ${repair.id.slice(0, 8)}`,
                                    size: "xs",
                                    color: "#aaaaaa",
                                    margin: "sm"
                                },
                                {
                                    type: "separator",
                                    margin: "md"
                                },
                                {
                                    type: "text",
                                    text: statusText,
                                    size: "xl",
                                    align: "center",
                                    margin: "lg",
                                    weight: "bold"
                                }
                            ]
                        },
                        footer: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "button",
                                    action: {
                                        type: "uri",
                                        label: "ดูรายละเอียด",
                                        uri: `${Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"}/repair/history`
                                    },
                                    style: "primary",
                                    color: "#00B900"
                                }
                            ]
                        }
                    }
                }
            ],
        };

        const res = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${channelAccessToken}`,
            },
            body: JSON.stringify(message),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("LINE API Error:", text);
            return new Response(JSON.stringify({ error: text }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ message: "Notification sent" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in notify-repair-update:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
