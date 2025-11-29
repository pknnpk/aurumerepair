import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterSuccessPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">ลงทะเบียนสำเร็จ</h2>
                <p className="text-slate-600">
                    ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว คุณสามารถปิดหน้านี้ได้เลย
                </p>
            </div>
        </div>
    );
}
