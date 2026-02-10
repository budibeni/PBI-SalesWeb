"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {User, Lock, Eye, EyeOff, ShieldCheck,  BookOpenText} from "lucide-react"

export default function LoginPage() {
    const search = useSearchParams()
    const redirect   = search.get("redirect")   || "/"
    const errorMsg   = search.get("error")      || ""
    const prefillId  = search.get("identifier") || ""

    const idRef = useRef(null)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => { idRef.current?.focus() }, [])

    return (
        <div className="min-h-dvh grid place-items-center bg-background">
            <div className="absolute top-5 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-3 rounded-full bg-card px-4 py-2  ring-1 ring-border">
          <span className="grid size-7 place-items-center rounded-xl bg-foreground text-background">
            <ShieldCheck className="size-4" />
          </span>
                    <span className="text-sm font-medium">SalesGo</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">Power Block Indonesia</span>
                </div>
            </div>

            <Card className="w-[92%] max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Selamat Datang</CardTitle>
                    <CardDescription>
                        Silahkan login untuk masuk ke dalam sistem
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {errorMsg && (
                        <div
                            role="alert"
                            className="mb-3 rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-sm text-red-700
              dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-200"
                        >
                            {errorMsg}
                        </div>
                    )}

                    <form action="/api/auth/login" method="post" className="grid gap-4">
                        <input type="hidden" name="redirect" value={redirect} />

                        <div className="grid gap-1.5">
                            <Label htmlFor="identifier">Email atau Akun</Label>
                            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                  <User className="size-4" />
                </span>
                                <Input
                                    ref={idRef}
                                    id="identifier"
                                    name="identifier"
                                    placeholder="email@domain.com / username"
                                    autoComplete="username"
                                    className="pl-9"
                                    required
                                    defaultValue={prefillId}
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password">Kata Sandi</Label>
                            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                  <Lock className="size-4" />
                </span>
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="pl-9 pr-10"
                                    required
                                    defaultValue=""
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">Masuk</Button>
                    </form>



                </CardContent>

                <CardFooter className="flex justify-between text-xs text-muted-foreground">
                    <span>© {new Date().getFullYear()} Bensoft SalesGo</span>
                    <Button asChild variant="secondary" size="sm" >
                        <Link href="/artikel/terbit" prefetch={false} title="Kenal lebih dekat dengan kami" aria-label="Kenal Lebih Dekat">
                            <BookOpenText className="h-4 w-4 mr-1" />
                            Pelajari
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
