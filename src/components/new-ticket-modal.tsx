"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

type NewTicketModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

export function NewTicketModal({
    open,
    onOpenChange,
    onSuccess,
}: NewTicketModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        returnMethod: "pickup",
        customerName: "",
        customerMobile: "",
    });

    const handleSubmit = async () => {
        if (!session?.user) return;
        setLoading(true);

        try {
            const res = await fetch("/api/repairs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: [{ description: formData.description, images: [], plating: false }],
                    returnMethod: formData.returnMethod,
                    // Note: We might need to handle walk-in customer details in the API or DB schema
                    // For now, we are just creating a ticket.
                }),
            });

            if (res.ok) {
                onSuccess();
                onOpenChange(false);
                setFormData({
                    description: "",
                    returnMethod: "pickup",
                    customerName: "",
                    customerMobile: "",
                });
            } else {
                console.error("Failed to create ticket");
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>เปิดใบงานใหม่ (Walk-in)</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>ชื่อลูกค้า (ไม่บังคับ)</Label>
                        <Input
                            value={formData.customerName}
                            onChange={(e) =>
                                setFormData({ ...formData, customerName: e.target.value })
                            }
                            placeholder="ลูกค้าหน้าร้าน"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>เบอร์โทร (ไม่บังคับ)</Label>
                        <Input
                            value={formData.customerMobile}
                            onChange={(e) =>
                                setFormData({ ...formData, customerMobile: e.target.value })
                            }
                            placeholder="08x-xxx-xxxx"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>รายละเอียดการซ่อม</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="ระบุอาการ..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>การรับคืน</Label>
                        <Select
                            value={formData.returnMethod}
                            onValueChange={(val) =>
                                setFormData({ ...formData, returnMethod: val })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pickup">รับเอง</SelectItem>
                                <SelectItem value="mail">ส่งไปรษณีย์</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "กำลังสร้าง..." : "สร้างใบงาน"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
