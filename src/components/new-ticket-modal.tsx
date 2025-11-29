"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
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
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        returnMethod: "pickup",
        customerName: "", // Optional for walk-ins
        customerMobile: "",
    });

    const handleSubmit = async () => {
        setLoading(true);

        // Create repair request
        const { error } = await supabase.from("repairs").insert({
            customer_id: null, // Anonymous/Walk-in
            items: [{ description: formData.description, images: [], plating: false }],
            return_method: formData.returnMethod,
            status: "pending_check",
            // Store walk-in details in items or a separate field? 
            // For now, let's append to description or just rely on manual tracking
            // Ideally we should have a 'customer_details' jsonb column for guest info
        });

        if (error) {
            console.error("Error creating ticket:", error);
        } else {
            onSuccess();
            onOpenChange(false);
            setFormData({
                description: "",
                returnMethod: "pickup",
                customerName: "",
                customerMobile: "",
            });
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
