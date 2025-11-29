import {
    WebhookEvent,
    messagingApi,
    validateSignature,
} from "@line/bot-sdk";
import { NextResponse } from "next/server";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

const client = new messagingApi.MessagingApiClient({
    channelAccessToken,
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature") as string;

    if (!validateSignature(body, channelSecret, signature)) {
        return NextResponse.json(
            { message: "Invalid signature" },
            { status: 401 }
        );
    }

    const events: WebhookEvent[] = JSON.parse(body).events;

    await Promise.all(
        events.map(async (event) => {
            if (event.type !== "message" || event.message.type !== "text") {
                return;
            }

            const text = event.message.text.trim();
            const userId = event.source.userId;

            if (!userId) return;

            if (text === "ลงทะเบียน" || text === "แก้ทะเบียน") {
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [
                        {
                            type: "template",
                            altText: "ลงทะเบียน/แก้ไขข้อมูล",
                            template: {
                                type: "buttons",
                                text: "กรุณากดปุ่มด้านล่างเพื่อลงทะเบียนหรือแก้ไขข้อมูล",
                                actions: [
                                    {
                                        type: "uri",
                                        label: "ลงทะเบียน / แก้ไขข้อมูล",
                                        uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
                                            "54321",
                                            "3000"
                                        )}/register`, // Using localhost:3000 for now, in prod this should be the real URL
                                    },
                                ],
                            },
                        },
                    ],
                });
            } else if (text === "ส่งซ่อม") {
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [
                        {
                            type: "template",
                            altText: "ส่งซ่อม",
                            template: {
                                type: "buttons",
                                text: "กรุณากดปุ่มด้านล่างเพื่อส่งคำขอซ่อม",
                                actions: [
                                    {
                                        type: "uri",
                                        label: "แจ้งส่งซ่อม",
                                        uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
                                            "54321",
                                            "3000"
                                        )}/repair/new`,
                                    },
                                ],
                            },
                        },
                    ],
                });
            }
        })
    );

    return NextResponse.json({ message: "OK" });
}
