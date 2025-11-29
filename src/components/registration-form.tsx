"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
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

type ThaiLocation = {
    id: number;
    province: string;
    amphoe: string;
    tambon: string;
    zipcode: string;
};

export default function RegistrationForm() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<ThaiLocation[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [amphoes, setAmphoes] = useState<string[]>([]);
    const [tambons, setTambons] = useState<string[]>([]);
    const [addressId, setAddressId] = useState<string | null>(null);

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
            // Fetch locations
            const { data: locationsData } = await supabase.from("thai_locations").select("*");
            if (locationsData) {
                setLocations(locationsData);
                const uniqueProvinces = Array.from(new Set(locationsData.map((l) => l.province)));
                setProvinces(uniqueProvinces);
            }

            // Fetch User Data
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                const { data: address } = await supabase.from("addresses").select("*").eq("user_id", user.id).eq("is_default", true).single();

                if (profile) {
                    setFormData((prev) => ({
                        ...prev,
                        firstName: profile.first_name || "",
                        lastName: profile.last_name || "",
                        birthDate: profile.birth_date || "",
                        birthTime: profile.birth_time || "",
                        birthGender: profile.birth_gender || "",
                        mobile: profile.mobile || "",
                        email: profile.email || "",
                    }));
                }

                if (address && locationsData) {
                    setAddressId(address.id);
                    setFormData((prev) => ({
                        ...prev,
                        province: address.province,
                        district: address.district,
                        subDistrict: address.sub_district,
                        postalCode: address.postal_code,
                        details: address.details || "",
                    }));

                    // Pre-fill cascading dropdowns
                    const filteredAmphoes = Array.from(
                        new Set(locationsData.filter((l) => l.province === address.province).map((l) => l.amphoe))
                    );
                    setAmphoes(filteredAmphoes);

                    const filteredTambons = Array.from(
                        new Set(
                            locationsData
                                .filter((l) => l.province === address.province && l.amphoe === address.district)
                                .map((l) => l.tambon)
                        )
                    );
                    setTambons(filteredTambons);
                }
            }
        };
        fetchData();
    }, []);

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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update Profile
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                first_name: formData.firstName,
                last_name: formData.lastName,
                birth_date: formData.birthDate,
                birth_time: formData.birthTime || null,
                birth_gender: formData.birthGender,
                mobile: formData.mobile,
                email: formData.email,
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("Error updating profile:", profileError);
            setLoading(false);
            return;
        }

        // Upsert Address
        if (addressId) {
            const { error: addressError } = await supabase
                .from("addresses")
                .update({
                    province: formData.province,
                    district: formData.district,
                    sub_district: formData.subDistrict,
                    postal_code: formData.postalCode,
                    details: formData.details,
                })
                .eq("id", addressId);

            if (addressError) {
                console.error("Error updating address:", addressError);
                setLoading(false);
                return;
            }
        } else {
            const { error: addressError } = await supabase.from("addresses").insert({
                user_id: user.id,
                province: formData.province,
                district: formData.district,
                sub_district: formData.subDistrict,
                postal_code: formData.postalCode,
                details: formData.details,
                is_default: true,
            });

            if (addressError) {
                console.error("Error inserting address:", addressError);
                setLoading(false);
                return;
            }
        }

        setLoading(false);
        router.push("/register/success");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
                {addressId ? "แก้ไขข้อมูลส่วนตัว" : "ลงทะเบียนลูกค้าใหม่"}
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
                {loading ? "กำลังบันทึก..." : (addressId ? "บันทึกการแก้ไข" : "ลงทะเบียน")}
            </Button>
        </form>
    );
}
