import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-2xl font-bold mb-8">Aurume Repair Login</h1>
            <form
                action={async () => {
                    "use server"
                    await signIn("line")
                }}
            >
                <Button type="submit" className="bg-[#00B900] hover:bg-[#009900] text-white font-bold py-2 px-4 rounded">
                    Sign in with LINE
                </Button>
            </form>
        </div>
    )
}
