"use client";

import { useEffect, useState } from "react";
import KanbanBoard from "@/components/kanban-board";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ManagerBoardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const checkRole = async () => {
            if (!session?.user) return;

            // @ts-ignore
            const role = session.user.role;

            if (["manager", "finance"].includes(role)) {
                setIsAuthorized(true);
            } else {
                router.push("/"); // Redirect unauthorized users
            }
            setLoading(false);
        };

        if (session?.user) {
            checkRole();
        }
    }, [session, router]);

    if (status === "loading" || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthorized) {
        return null; // or Access Denied
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Manager Board</h1>
                <p className="text-slate-500">จัดการรายการซ่อมทั้งหมด</p>
            </div>
            <KanbanBoard />
        </div>
    );
}
