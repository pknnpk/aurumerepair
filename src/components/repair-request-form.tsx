"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";

type RepairItem = {
    id: string;
    description: string;
    images: File[];
    plating: boolean;
};

export default function RepairRequestForm() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [returnMethod, setReturnMethod] = useState<"pickup" | "mail">("pickup");
    const [items, setItems] = useState<RepairItem[]>([
        { id: crypto.randomUUID(), description: "", images: [], plating: false },
    ]);

    const addItem = () => {
        setItems([
            ...items,
            { id: crypto.randomUUID(), description: "", images: [], plating: false },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof RepairItem, value: any) => {
        setItems(
            items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleImageChange = (id: string, files: FileList | null) => {
        if (!files) return;
        const newImages = Array.from(files);
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, images: [...item.images, ...newImages] } : item
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!session?.user) return;

        try {
            // Upload images and prepare item data
            const processedItems = await Promise.all(
                items.map(async (item) => {
                    const imageUrls = await Promise.all(
                        item.images.map(async (file) => {
                            // Get Signed URL
                            const res = await fetch("/api/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    filename: file.name,
                                    contentType: file.type,
                                }),
                            });

                            if (!res.ok) throw new Error("Failed to get upload URL");
                            const { url, publicUrl } = await res.json();

                            // Upload to GCS
                            const uploadRes = await fetch(url, {
                                method: "PUT",
                                headers: { "Content-Type": file.type },
                                body: file,
                            });

                            if (!uploadRes.ok) throw new Error("Failed to upload image");

                            return publicUrl;
                        })
                    );

                    return {
                        description: item.description,
                        plating: item.plating,
                        images: imageUrls,
                    };
                })
            );

            // Create Repair Request
            const res = await fetch("/api/repairs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: processedItems,
                    returnMethod,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to create repair request");
            }

            setLoading(false);
            router.push("/repair/success");
        } catch (error) {
            console.error("Error creating repair request:", error);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">แจ้งส่งซ่อม</h2>

            <div className="space-y-6">
                {items.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-4 bg-slate-50 relative">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">รายการที่ {index + 1}</Label>
                            {items.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" /> ลบรายการ
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>รายละเอียดการซ่อม</Label>
                            <Textarea
                                required
                                value={item.description}
                                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                placeholder="ระบุอาการที่ต้องการซ่อม เช่น สร้อยขาด, พลอยหลุด"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>รูปภาพประกอบ</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleImageChange(item.id, e.target.files)}
                                    className="cursor-pointer"
                                />
                            </div>
                            {item.images.length > 0 && (
                                <div className="text-sm text-slate-500">
                                    เลือกแล้ว {item.images.length} รูป
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`plating-${item.id}`}
                                checked={item.plating}
                                onCheckedChange={(checked) =>
                                    updateItem(item.id, "plating", checked)
                                }
                            />
                            <Label htmlFor={`plating-${item.id}`}>ต้องการชุบใหม่</Label>
                        </div>
                    </div>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    className="w-full border-dashed"
                >
                    <Plus className="h-4 w-4 mr-2" /> เพิ่มรายการซ่อม
                </Button>
            </div>

            <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">วิธีการรับสินค้าคืน</Label>
                <Select
                    value={returnMethod}
                    onValueChange={(val: "pickup" | "mail") => setReturnMethod(val)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pickup">รับเองที่ร้าน (Pickup)</SelectItem>
                        <SelectItem value="mail">จัดส่งทางไปรษณีย์ (Mail)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" className="w-full bg-[#B8860B] hover:bg-[#A0750A] text-white" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "ส่งแจ้งซ่อม"}
            </Button>
        </form>
    );
}
