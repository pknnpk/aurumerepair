"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleLineLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "line" as any,
            options: {
                redirectTo: `${window.location.origin}/auth/callback/line`,
            },
        });

        if (error) {
            console.error("Error logging in with LINE:", error.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Aurume Shop</h1>
                    <p className="mt-2 text-slate-600">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                </div>

                <div className="mt-8 space-y-4">
                    <Button
                        onClick={handleLineLogin}
                        disabled={loading}
                        className="w-full bg-[#00B900] hover:bg-[#009900] text-white font-bold py-3"
                    >
                        {loading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย LINE"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
