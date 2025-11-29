"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
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
import QRCode from "react-qr-code";

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
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState<any>(null);
    const [formData, setFormData] = useState({
        status: repair?.status || "",
        costInternal: repair?.cost_internal || "",
        costExternal: repair?.cost_external || "",
        discount: repair?.discount || "",
        shippingCost: repair?.shipping_cost || "",
    });

    useEffect(() => {
        if (repair?.customer_id) {
            const fetchCustomer = async () => {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", repair.customer_id)
                    .single();
                setCustomer(data);
            };
            fetchCustomer();
        }
        if (repair) {
            setFormData({
                status: repair.status || "",
                costInternal: repair.cost_internal || "",
                costExternal: repair.cost_external || "",
                discount: repair.discount || "",
                shippingCost: repair.shipping_cost || "",
            });
        }
    }, [repair]);

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from("repairs")
            .update({
                status: formData.status,
                cost_internal: formData.costInternal || null,
                cost_external: formData.costExternal || null,
                discount: formData.discount || 0,
                shipping_cost: formData.shippingCost || 0,
            })
            .eq("id", repair.id);

        if (error) {
            console.error("Error updating ticket:", error);
        } else {
            if (repair.status !== formData.status) {
                await supabase.functions.invoke('notify-repair-update', {
                    body: { repairId: repair.id, newStatus: formData.status }
                });
            }
            onUpdate();
            onOpenChange(false);
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.open(`/manager/print/${repair.id}`, '_blank');
    };

    if (!repair) return null;

    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    const handleGeneratePaymentLink = async () => {
        setIsGeneratingLink(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-payment-link', {
                body: { repairId: repair.id }
            });

            if (error) throw error;

            if (data && data.url) {
                setPaymentLink(data.url);
                // Optionally save this link to the repair record if you want to persist it
                // For now, we just show it.
            } else {
                alert("Failed to generate link: " + JSON.stringify(data));
            }
        } catch (err: any) {
            console.error("Error generating link:", err);
            alert("Error: " + err.message);
        } finally {
            setIsGeneratingLink(false);
        }
    };

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
                                    {customer.first_name} {customer.last_name}
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
                                {repair.customer_id ? "กำลังโหลด..." : "ลูกค้าหน้าร้าน (Walk-in)"}
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
                                {repair.return_method === "pickup" ? "รับเอง" : "ส่งไปรษณีย์"}
                            </p>
                            <p>
                                <span className="font-medium">วันที่แจ้ง:</span>{" "}
                                {new Date(repair.created_at).toLocaleString("th-TH")}
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

                        {/* Payment Link Section */}
                        <div className="w-full border-t pt-4 mt-2">
                            {!paymentLink ? (
                                <Button
                                    onClick={handleGeneratePaymentLink}
                                    disabled={isGeneratingLink}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isGeneratingLink ? "กำลังสร้างลิงก์..." : "สร้างลิงก์ชำระเงิน (Beam)"}
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-green-600 font-semibold">สร้างลิงก์สำเร็จ!</Label>
                                    <div className="flex gap-2">
                                        <Input value={paymentLink} readOnly />
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(paymentLink);
                                                alert("Copied!");
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="flex justify-center p-2 border rounded bg-white">
                                        <QRCode value={paymentLink} size={150} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Shipment Section */}
                        {repair.return_method === 'mail' && (
                            <div className="w-full border-t pt-4 mt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <Label className="font-semibold">การจัดส่ง (Shipnity)</Label>
                                    {repair.tracking_number && (
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            {repair.tracking_number}
                                        </Badge>
                                    )}
                                </div>
                                {!repair.tracking_number ? (
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const { data, error } = await supabase.functions.invoke('create-shipment', {
                                                    body: { repairId: repair.id }
                                                });
                                                if (error) throw error;
                                                alert(`Shipment Created! Tracking: ${data.trackingNumber}`);
                                                onUpdate(); // Refresh data
                                                onOpenChange(false); // Close modal to refresh parent or just refresh
                                            } catch (e: any) {
                                                alert("Error: " + e.message);
                                            }
                                        }}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                        สร้างรายการจัดส่ง (Mock)
                                    </Button>
                                ) : (
                                    <div className="text-sm text-slate-500">
                                        Tracking Number: {repair.tracking_number}
                                    </div>
                                )}
                            </div>
                        )}
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
