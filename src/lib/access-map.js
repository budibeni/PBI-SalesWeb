// lib/access-map.js
import { ACCESS_ITEMS } from "./access-items"

// escape regex helper
const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// rules protected (untuk pengecekan akses)
const PROTECTED_RULES = ACCESS_ITEMS
    .filter(it => !it.public)
    .sort((a, b) => b.href.length - a.href.length)
    .map(it => ({ id: it.id, re: new RegExp(`^${rx(it.href)}(?:/|$)`) }))

// rules public (untuk bypass login/akses)
const PUBLIC_RULES = ACCESS_ITEMS
    .filter(it => it.public)
    .sort((a, b) => b.href.length - a.href.length)
    .map(it => ({ id: it.id, re: new RegExp(`^${rx(it.href)}(?:/|$)`) }))

export function getAccessIdByPath(pathname) {
    const r = PROTECTED_RULES.find(r => r.re.test(pathname))
    return r?.id || null
}

export function isPublicByAccessItems(pathname) {
    return PUBLIC_RULES.some(r => r.re.test(pathname))
}
