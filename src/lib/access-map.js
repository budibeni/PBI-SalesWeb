// lib/access-map.js
import { ACCESS_ITEMS } from "@/lib/access-items"

// escape untuk regex
function rxEscape(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Urutkan by panjang href (spesifik dulu) lalu buat tester
export const ACCESS_RULES = ACCESS_ITEMS
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .map(({ id, href }) => ({
        id,
        re: new RegExp(`^${rxEscape(href)}(?:/|$)`),
    }))

export function getAccessIdByPath(pathname) {
    const rule = ACCESS_RULES.find((r) => r.re.test(pathname))
    return rule?.id || null
}
