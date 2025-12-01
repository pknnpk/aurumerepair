"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const statusMap: Record<string, { label: string; color: string }> = {
    pending_check: { label: "รอเช็ค", color: "bg-yellow-500" },
    pending_send: { label: "รอส่ง", color: "bg-orange-500" },
    repairing: { label: "กำลังซ่อม", color: "bg-blue-500" },
    repair_done: { label: "ซ่อมเสร็จ", color: "bg-indigo-500" },
    pending_payment: { label: "รอชำระ", color: "bg-pink-500" },
    ready_to_ship: { label: "พร้อมส่ง", color: "bg-purple-500" },
    completed: { label: "เสร็จสิ้น", color: "bg-green-500" },
};

export default function RepairHistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [repairs, setRepairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const fetchRepairs = async () => {
            if (!session?.user) return;
            try {
                const res = await fetch("/api/repairs");
                if (res.ok) {
                    const data = await res.json();
                    setRepairs(data);
                }
            } catch (error) {
                console.error("Error fetching repairs:", error);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user) {
            fetchRepairs();
        }
    }, [session]);

    if (status === "loading" || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900">ประวัติการซ่อม</h1>
                    <Link href="/repair/new">
                        <Button className="bg-[#00B900] hover:bg-[#009900]">
                            <Plus className="mr-2 h-4 w-4" /> ส่งซ่อมใหม่
                        </Button>
                    </Link>
                </div>

                {repairs && repairs.length > 0 ? (
                    <div className="space-y-4">
                        {repairs.map((repair) => (
                            <div
                                key={repair.id}
                                className="bg-white p-4 rounded-xl shadow-sm border space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm text-slate-500">
                                            รหัสใบซ่อม: {repair.id.slice(0, 8)}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(repair.createdAt).toLocaleDateString("th-TH", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </div>
                                    <Badge
                                        className={`${statusMap[repair.status]?.color || "bg-gray-500"
                                            } hover:${statusMap[repair.status]?.color || "bg-gray-500"}`}
                                    >
                                        {statusMap[repair.status]?.label || repair.status}
                                    </Badge>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="text-sm font-medium mb-2">รายการซ่อม:</div>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                        {repair.items.map((item: any, index: number) => (
                                            <li key={index}>
                                                {item.description} {item.plating && "(ชุบใหม่)"}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {repair.totalPrice && (
                                    <div className="border-t pt-3 flex justify-between items-center">
                                        <div className="text-sm font-medium">ราคาประเมิน:</div>
                                        <div className="text-lg font-bold text-[#00B900]">
                                            ฿{parseFloat(repair.totalPrice).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <p className="text-slate-500">ยังไม่มีประวัติการซ่อม</p>
                    </div>
                )}
            </div>
        </div>
    );
}
