
import { KeyRound } from "lucide-react"
import PasswordForm from "@/app/account/ui/PasswordForm";

export const dynamic = "force-dynamic"

export default function PasswordPage() {
    return (
        <main className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                <KeyRound className="h-5 w-5" />
                Ganti Kata Sandi
            </h1>
            <PasswordForm />
        </main>
    )
}
