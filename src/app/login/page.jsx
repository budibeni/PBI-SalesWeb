"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
    const router = useRouter()
    const search = useSearchParams()
    const redirect = search.get("redirect") || "/dashboard"

    const [identifier, setIdentifier] = useState("admin@example.com") // atau "admin"
    const [password, setPassword] = useState("admin123")
    const [err, setErr] = useState("")
    const [loading, setLoading] = useState(false)

    const onSubmit = async (e) => {
        e.preventDefault()
        setErr("")
        setLoading(true)
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Login gagal")
            router.replace(redirect)
        } catch (e) {
            setErr(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main style={{display:"grid",placeItems:"center",minHeight:"100vh"}}>
            <form onSubmit={onSubmit} style={{display:"grid",gap:8,minWidth:320}}>
                <h1>Masuk</h1>
                <input
                    placeholder="Email atau Akun"
                    value={identifier}
                    onChange={(e)=>setIdentifier(e.target.value)}
                    required
                />
                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    required
                />
                <button disabled={loading}>{loading ? "Memproses..." : "Masuk"}</button>
                {err && <p style={{color:"crimson"}}>{err}</p>}
            </form>
        </main>
    )
}
