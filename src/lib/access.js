// lib/access.js
import { ACCESS_ITEMS } from "./access-items"

// hanya item yang butuh akses (non-public)
export const PROTECTED_ITEMS = ACCESS_ITEMS.filter(it => !it.public)

// defaultAccess: semua off (atau on, jika mau)
export function defaultAccess(on = false) {
    const acc = {}
    for (const it of PROTECTED_ITEMS) acc[it.id] = !!on
    return acc
}

// normalisasi object akses agar hanya berisi key protected
export function normalizeAccess(input) {
    const safe = defaultAccess(false)
    if (!input || typeof input !== "object") return safe
    for (const it of PROTECTED_ITEMS) {
        if (Object.prototype.hasOwnProperty.call(input, it.id)) {
            safe[it.id] = !!input[it.id]
        }
    }
    return safe
}

// editor akses dikelompokkan per section (non-public saja)
export function groupMenusBySection() {
    const by = {}
    for (const it of PROTECTED_ITEMS) {
        by[it.section] = by[it.section] || []
        by[it.section].push({ id: it.id, label: it.label })
    }
    return by
}
