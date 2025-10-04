// lib/access.js
import { SIDEBAR_MENUS } from "@/components/constants/sidebar-menu"

export function getMenuIds() {
    return SIDEBAR_MENUS.map(m => m.id)
}

export function groupMenusBySection() {
    return SIDEBAR_MENUS.reduce((acc, m) => {
        acc[m.section] = acc[m.section] || []
        acc[m.section].push(m)
        return acc
    }, {})
}

export function defaultAccess(defaultValue = false) {
    const obj = {}
    for (const id of getMenuIds()) obj[id] = !!defaultValue
    return obj
}

export function normalizeAccess(input = {}) {
    const ids = new Set(getMenuIds())
    const out = defaultAccess(false)
    for (const k of Object.keys(input || {})) {
        if (ids.has(k)) out[k] = !!input[k]
    }
    return out
}
