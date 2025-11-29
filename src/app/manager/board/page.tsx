import KanbanBoard from "@/components/kanban-board";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagerBoardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // TODO: Check if user has manager role
    // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    // if (profile?.role !== 'manager') redirect('/')

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
