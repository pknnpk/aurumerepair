"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { useSession } from "next-auth/react";

type TicketDetailModalProps = {
    repair: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
};

export function TicketDetailModal({
    repair,
    open,
    onOpenChange,
    onUpdate,
}: TicketDetailModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: repair?.status || "",
        costInternal: repair?.costInternal || "",
        costExternal: repair?.costExternal || "",
        discount: repair?.discount || "",
        shippingCost: repair?.shippingCost || "",
    });

    useEffect(() => {
        if (repair) {
            setFormData({
                status: repair.status || "",
                costInternal: repair.costInternal || "",
                costExternal: repair.costExternal || "",
                discount: repair.discount || "",
                shippingCost: repair.shippingCost || "",
            });
        }
    }, [repair]);

    const handleSave = async () => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/${repair.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: formData.status,
                    costInternal: formData.costInternal || null,
                    costExternal: formData.costExternal || null,
                    discount: formData.discount || 0,
                    shippingCost: formData.shippingCost || 0,
                }),
            });

            if (res.ok) {
                onUpdate();
                onOpenChange(false);
            } else {
                console.error("Failed to update ticket");
            }
        } catch (error) {
            console.error("Error updating ticket:", error);
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.open(`/manager/print/${repair.id}`, '_blank');
    };

    if (!repair) return null;

    const customer = repair.customer;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>ใบแจ้งซ่อม #{repair.id.slice(0, 8)}</span>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" /> พิมพ์
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">ข้อมูลลูกค้า</h3>
                        {customer ? (
                            <div className="text-sm space-y-1">
                                <p>
                                    <span className="font-medium">ชื่อ:</span>{" "}
                                    {customer.firstName} {customer.lastName}
                                </p>
                                <p>
                                    <span className="font-medium">เบอร์โทร:</span> {customer.mobile}
                                </p>
                                <p>
                                    <span className="font-medium">อีเมล:</span> {customer.email}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                ลูกค้าหน้าร้าน (Walk-in)
                            </p>
                        )}
                    </div>

                    {/* Repair Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">รายละเอียดการซ่อม</h3>
                        <div className="text-sm space-y-3">
                            <div className="space-y-1">
                                <Label>สถานะ</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending_check">รอเช็ค</SelectItem>
                                        <SelectItem value="pending_send">รอส่ง</SelectItem>
                                        <SelectItem value="repairing">กำลังซ่อม</SelectItem>
                                        <SelectItem value="repair_done">ซ่อมเสร็จ</SelectItem>
                                        <SelectItem value="pending_payment">รอชำระ</SelectItem>
                                        <SelectItem value="ready_to_ship">พร้อมส่ง</SelectItem>
                                        <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p>
                                <span className="font-medium">การรับคืน:</span>{" "}
                                {repair.returnMethod === "pickup" ? "รับเอง" : "ส่งไปรษณีย์"}
                            </p>
                            <p>
                                <span className="font-medium">วันที่แจ้ง:</span>{" "}
                                {new Date(repair.createdAt).toLocaleString("th-TH")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="mt-6">
                    <h3 className="font-semibold border-b pb-2 mb-4">รายการสินค้า</h3>
                    <div className="space-y-4">
                        {repair.items.map((item: any, index: number) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border">
                                <p className="font-medium mb-2">รายการที่ {index + 1}</p>
                                <p className="text-sm text-slate-600 mb-2">
                                    {item.description}
                                </p>
                                {item.plating && (
                                    <Badge variant="secondary" className="mb-2">
                                        ต้องการชุบ
                                    </Badge>
                                )}
                                <div className="flex gap-2 overflow-x-auto">
                                    {item.images.map((url: string, i: number) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`Item ${index + 1} - ${i + 1}`}
                                            className="h-24 w-24 object-cover rounded-md border"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing */}
                <div className="mt-6 bg-slate-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-4">ราคาและค่าใช้จ่าย</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ต้นทุน (ภายใน)</Label>
                            <Input
                                type="number"
                                value={formData.costInternal}
                                onChange={(e) =>
                                    setFormData({ ...formData, costInternal: e.target.value })
                                }
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ราคาลูกค้า</Label>
                            <Input
                                type="number"
                                value={formData.costExternal}
                                onChange={(e) =>
                                    setFormData({ ...formData, costExternal: e.target.value })
                                }
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ส่วนลด</Label>
                            <Input
                                type="number"
                                value={formData.discount}
                                onChange={(e) =>
                                    setFormData({ ...formData, discount: e.target.value })
                                }
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ค่าจัดส่ง</Label>
                            <Input
                                type="number"
                                value={formData.shippingCost}
                                onChange={(e) =>
                                    setFormData({ ...formData, shippingCost: e.target.value })
                                }
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col items-end gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">รวมทั้งสิ้น:</span>
                            <span className="text-2xl font-bold text-[#00B900]">
                                ฿
                                {(
                                    (parseFloat(formData.costExternal) || 0) -
                                    (parseFloat(formData.discount) || 0) +
                                    (parseFloat(formData.shippingCost) || 0)
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
