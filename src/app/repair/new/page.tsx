"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RepairRequestForm from "@/components/repair-request-form";
import { useSession } from "next-auth/react";

export default function RepairPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!session?.user) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <RepairRequestForm />
        </div>
    );
}
