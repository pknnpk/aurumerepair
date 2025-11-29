import RegistrationForm from "@/components/registration-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <RegistrationForm />
        </div>
    );
}
