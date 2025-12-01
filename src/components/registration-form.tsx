"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ThaiLocation = {
    id: string;
    province: string;
    amphoe: string;
    tambon: string;
    zipcode: string;
};

export default function RegistrationForm() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<ThaiLocation[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [amphoes, setAmphoes] = useState<string[]>([]);
    const [tambons, setTambons] = useState<string[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        birthDate: "",
        birthTime: "",
        birthGender: "",
        mobile: "",
        email: "",
        province: "",
        district: "",
        subDistrict: "",
        postalCode: "",
        details: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) return;

            try {
                // Fetch locations
                const locRes = await fetch("/api/locations");
                const locationsData = await locRes.json();
                if (locationsData) {
                    setLocations(locationsData);
                    const uniqueProvinces = Array.from(new Set(locationsData.map((l: ThaiLocation) => l.province))) as string[];
                    setProvinces(uniqueProvinces);
                }

                // Fetch User Data
                const profileRes = await fetch("/api/profile");

                if (profileRes.ok) {
                    const { profile, address } = await profileRes.json();

                    if (profile) {
                        setIsEditMode(true);
                        setFormData((prev) => ({
                            ...prev,
                            firstName: profile.firstName || "",
                            lastName: profile.lastName || "",
                            birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : "",
                            birthTime: profile.birthTime || "",
                            birthGender: profile.birthGender || "",
                            mobile: profile.mobile || "",
                            email: profile.email || session.user?.email || "",
                        }));
                    } else {
                        // Pre-fill email from NextAuth user
                        setFormData((prev) => ({ ...prev, email: session.user?.email || "" }));
                    }

                    if (address && locationsData) {
                        setFormData((prev) => ({
                            ...prev,
                            province: address.province,
                            district: address.district,
                            subDistrict: address.subDistrict,
                            postalCode: address.postalCode,
                            details: address.details || "",
                        }));

                        // Pre-fill cascading dropdowns
                        const filteredAmphoes = Array.from(
                            new Set(locationsData.filter((l: ThaiLocation) => l.province === address.province).map((l: ThaiLocation) => l.amphoe))
                        ) as string[];
                        setAmphoes(filteredAmphoes);

                        const filteredTambons = Array.from(
                            new Set(
                                locationsData
                                    .filter((l: ThaiLocation) => l.province === address.province && l.amphoe === address.district)
                                    .map((l: ThaiLocation) => l.tambon)
                            )
                        ) as string[];
                        setTambons(filteredTambons);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [session]);

    const handleProvinceChange = (value: string) => {
        setFormData({ ...formData, province: value, district: "", subDistrict: "", postalCode: "" });
        const filteredAmphoes = Array.from(
            new Set(locations.filter((l) => l.province === value).map((l) => l.amphoe))
        );
        setAmphoes(filteredAmphoes);
    };

    const handleDistrictChange = (value: string) => {
        setFormData({ ...formData, district: value, subDistrict: "", postalCode: "" });
        const filteredTambons = Array.from(
            new Set(
                locations
                    .filter((l) => l.province === formData.province && l.amphoe === value)
                    .map((l) => l.tambon)
            )
        );
        setTambons(filteredTambons);
    };

    const handleSubDistrictChange = (value: string) => {
        const location = locations.find(
            (l) =>
                l.province === formData.province &&
                l.amphoe === formData.district &&
                l.tambon === value
        );
        setFormData({
            ...formData,
            subDistrict: value,
            postalCode: location ? location.zipcode : "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!session?.user) return;

        try {
            const payload = {
                ...formData,
                address: {
                    province: formData.province,
                    district: formData.district,
                    subDistrict: formData.subDistrict,
                    postalCode: formData.postalCode,
                    details: formData.details,
                }
            };

            let res;
            if (isEditMode) {
                res = await fetch("/api/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to save");
            }

            router.push("/register/success"); // Or dashboard
        } catch (error) {
            console.error("Error saving profile:", error);
            // Handle error (show toast etc)
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
                {isEditMode ? "แก้ไขข้อมูลส่วนตัว" : "ลงทะเบียนลูกค้าใหม่"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">ชื่อ</Label>
                    <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">นามสกุล</Label>
                    <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="birthDate">วันเกิด</Label>
                    <Input
                        id="birthDate"
                        type="date"
                        required
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="birthTime">เวลาเกิด (ไม่บังคับ)</Label>
                    <Input
                        id="birthTime"
                        type="time"
                        value={formData.birthTime}
                        onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="gender">เพศสภาพ</Label>
                <Select
                    value={formData.birthGender}
                    onValueChange={(value) => setFormData({ ...formData, birthGender: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">ชาย</SelectItem>
                        <SelectItem value="female">หญิง</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="mobile">เบอร์โทรศัพท์</Label>
                <Input
                    id="mobile"
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">ที่อยู่จัดส่ง</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>จังหวัด</Label>
                        <Select onValueChange={handleProvinceChange} value={formData.province}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกจังหวัด" />
                            </SelectTrigger>
                            <SelectContent>
                                {provinces.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>เขต/อำเภอ</Label>
                        <Select
                            onValueChange={handleDistrictChange}
                            value={formData.district}
                            disabled={!formData.province}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกเขต/อำเภอ" />
                            </SelectTrigger>
                            <SelectContent>
                                {amphoes.map((a) => (
                                    <SelectItem key={a} value={a}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>แขวง/ตำบล</Label>
                        <Select
                            onValueChange={handleSubDistrictChange}
                            value={formData.subDistrict}
                            disabled={!formData.district}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกแขวง/ตำบล" />
                            </SelectTrigger>
                            <SelectContent>
                                {tambons.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>รหัสไปรษณีย์</Label>
                        <Input value={formData.postalCode} readOnly className="bg-slate-50" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="details">รายละเอียดที่อยู่ (บ้านเลขที่, หมู่บ้าน, ซอย)</Label>
                    <Input
                        id="details"
                        required
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full bg-[#00B900] hover:bg-[#009900]" disabled={loading}>
                {loading ? "กำลังบันทึก..." : (isEditMode ? "บันทึกการแก้ไข" : "ลงทะเบียน")}
            </Button>
        </form>
    );
}
