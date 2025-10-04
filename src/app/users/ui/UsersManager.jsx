"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { groupMenusBySection, defaultAccess, normalizeAccess } from "@/lib/access"
import { SIDEBAR_MENUS } from "@/components/constants/sidebar-menu"
import { UserPlus, Settings2 } from "lucide-react"
import { useApiAuth } from "@/lib/client-api"

function AccessEditor({ value, onChange }) {
    const sections = useMemo(() => groupMenusBySection(), [])
    const state = normalizeAccess(value ?? defaultAccess(false))

    const setOne = (id, v) => onChange({ ...state, [id]: !!v })
    const setSection = (section, v) => {
        const next = { ...state }
        for (const m of sections[section] || []) next[m.id] = !!v
        onChange(next)
    }
    const allOn = Object.values(state).every(Boolean)
    const allOff = Object.values(state).every(v => !v)
    const setAll = (v) => {
        const next = {}
        for (const m of SIDEBAR_MENUS) next[m.id] = !!v
        onChange(next)
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <Button type="button" size="sm" variant={allOn ? "secondary" : "outline"} onClick={() => setAll(true)}>
                    Aktifkan Semua
                </Button>
                <Button type="button" size="sm" variant={allOff ? "secondary" : "outline"} onClick={() => setAll(false)}>
                    Nonaktifkan Semua
                </Button>
            </div>
            <Separator />
            {Object.entries(sections).map(([section, items]) => {
                const sectionOn = items.every(i => state[i.id])
                return (
                    <div key={section} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section}</div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setSection(section, !sectionOn)}>
                                {sectionOn ? "Matikan" : "Aktifkan"} {section}
                            </Button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {items.map(m => (
                                <label key={m.id} className="flex items-center gap-2 rounded-md border p-2">
                                    <Checkbox
                                        checked={!!state[m.id]}
                                        onCheckedChange={(v) => setOne(m.id, v)}
                                    />
                                    <span>{m.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function UsersManager({ initialUsers }) {
    const apiAuth = useApiAuth()
    const [users, setUsers] = useState(initialUsers || [])
    const [openNew, setOpenNew] = useState(false)
    const [openEdit, setOpenEdit] = useState(null) // user id atau null
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState("")

    // state form create
    const [f, setF] = useState({
        akun: "",
        email: "",
        noHp: "",
        nama: "",
        bagian: "",
        role: "user",
        password: "",
        akses: defaultAccess(false),
    })

    const createUser = async (e) => {
        e.preventDefault()
        setCreating(true); setError("")
        try {
            const res = await apiAuth("/api/users", {
                method: "POST",
                body: { ...f, akses: f.akses },
            })
            // ambil ulang list
            const list = await apiAuth("/api/users")
            setUsers(list?.users || [])
            setOpenNew(false)
            setF({ akun:"", email:"", noHp:"", nama:"", bagian:"", role:"user", password:"", akses: defaultAccess(false) })
        } catch (err) {
            setError(err.message)
        } finally {
            setCreating(false)
        }
    }

    const userById = (id) => users.find(u => u.id === id)
    const [editAccess, setEditAccess] = useState(defaultAccess(false))

    const openEditFor = (id) => {
        const u = userById(id)
        setEditAccess(normalizeAccess(u?.akses || {}))
        setOpenEdit(id)
    }

    const saveAccess = async () => {
        if (!openEdit) return
        setUpdating(true); setError("")
        try {
            await apiAuth(`/api/users/${openEdit}`, {
                method: "PATCH",
                body: { akses: editAccess },
            })
            // refresh list
            const list = await apiAuth("/api/users")
            setUsers(list?.users || [])
            setOpenEdit(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Kelola Pengguna</h1>
                <Dialog open={openNew} onOpenChange={setOpenNew}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="h-4 w-4 mr-2" /> Pengguna Baru</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Tambah Pengguna</DialogTitle></DialogHeader>

                        {error && (
                            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <form className="grid gap-4" onSubmit={createUser}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="akun">Akun</Label>
                                    <Input id="akun" value={f.akun} onChange={e=>setF(s=>({...s, akun:e.target.value}))} required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={f.email} onChange={e=>setF(s=>({...s, email:e.target.value}))} required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="noHp">No HP</Label>
                                    <Input id="noHp" value={f.noHp} onChange={e=>setF(s=>({...s, noHp:e.target.value}))} required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="nama">Nama</Label>
                                    <Input id="nama" value={f.nama} onChange={e=>setF(s=>({...s, nama:e.target.value}))} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="bagian">Bagian</Label>
                                    <Input id="bagian" value={f.bagian} onChange={e=>setF(s=>({...s, bagian:e.target.value}))} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Role</Label>
                                    <Select value={f.role} onValueChange={v=>setF(s=>({...s, role:v}))}>
                                        <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">user</SelectItem>
                                            <SelectItem value="admin">admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="password">Password (min 8)</Label>
                                    <Input id="password" type="password" value={f.password} onChange={e=>setF(s=>({...s, password:e.target.value}))} required />
                                </div>
                            </div>

                            <Separator />
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Akses Menu</Label>
                                <AccessEditor value={f.akses} onChange={(akses)=>setF(s=>({...s, akses}))} />
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <Button type="button" variant="ghost" onClick={()=>setOpenNew(false)}>Batal</Button>
                                <Button type="submit" disabled={creating}>{creating ? "Menyimpan..." : "Simpan"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {users.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengguna.</p>}
                    <div className="divide-y">
                        {users.map(u => (
                            <div key={u.id} className="py-3 flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{u.nama || u.akun || u.email}</div>
                                    <div className="text-xs text-muted-foreground truncate">{u.email} • {u.akun} • {u.role}</div>
                                </div>
                                <Dialog open={openEdit === u.id} onOpenChange={(v)=> v ? openEditFor(u.id) : setOpenEdit(null)}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline"><Settings2 className="h-4 w-4 mr-2" />Edit Akses</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader><DialogTitle>Edit Akses: {u.nama || u.akun}</DialogTitle></DialogHeader>

                                        {error && (
                                            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                                {error}
                                            </div>
                                        )}

                                        <AccessEditor value={editAccess} onChange={setEditAccess} />

                                        <div className="flex gap-2 justify-end pt-2">
                                            <Button type="button" variant="ghost" onClick={()=>setOpenEdit(null)}>Batal</Button>
                                            <Button onClick={saveAccess} disabled={updating}>{updating ? "Menyimpan..." : "Simpan"}</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
