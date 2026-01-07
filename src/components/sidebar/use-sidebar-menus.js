"use client";

/**
 * use-sidebar-menus.js
 * --------------------------------------------------
 * SINGLE SOURCE OF TRUTH untuk:
 * - mengambil data user login (me)
 * - menentukan hak akses menu
 * - menentukan menu aktif berdasarkan URL
 * - menghasilkan menu yang sudah difilter & dikelompokkan
 *
 * Dipakai oleh:
 * - AppSidebar
 * - Home (dropdown searchable)
 * - Komponen lain (breadcrumb, quick navigation, dll)
 *
 * Prinsip:
 * 👉 logic di satu tempat
 * 👉 UI bebas di mana saja
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SIDEBAR_MENUS } from "@/components/constants/sidebar-menu";

/* -------------------------------------------------------------------------- */
/*                               USER HANDLING                                */
/* -------------------------------------------------------------------------- */

/**
 * useMe
 * --------------------------------------------------------------------------
 * Hook untuk mengelola data user login (`me`)
 *
 * - Pakai initialUser dari layout jika ada
 * - Fallback fetch ke /api/me jika:
 *   - user belum ada
 *   - atau akses belum terisi
 *
 * @param {object|null} initialUser
 * @returns {object|null} me
 */
export function useMe(initialUser) {
    const [me, setMe] = useState(initialUser || null);

    useEffect(() => {
        // Jika user belum ada ATAU akses belum tersedia → fetch ulang
        if (!me || me.akses == null) {
            fetch("/api/me")
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => data && setMe(data))
                .catch(() => {
                    // sengaja dikosongkan → silent fail
                });
        }
    }, [me]);

    return me;
}

/* -------------------------------------------------------------------------- */
/*                             ACCESS POLICY LOGIC                             */
/* -------------------------------------------------------------------------- */

/**
 * canMenu
 * --------------------------------------------------------------------------
 * Menentukan apakah suatu menu BOLEH ditampilkan untuk user
 *
 * Urutan prioritas:
 * 1. menu public → selalu boleh
 * 2. user belum ada (loading) → tampilkan agar UI tidak kosong
 * 3. role admin → boleh semua
 * 4. akses belum kebaca → tampilkan dulu
 * 5. default → cek me.akses[item.id]
 *
 * @param {object} item  - item menu dari SIDEBAR_MENUS
 * @param {object|null} me
 * @returns {boolean}
 */
export function canMenu(item, me) {
    const hasAksesInfo = !!(me && typeof me.akses === "object");

    if (item.public) return true;
    if (!me) return true;
    if (me.role === "admin") return true;
    if (!hasAksesInfo) return true;

    return !!me.akses?.[item.id];
}

/* -------------------------------------------------------------------------- */
/*                             ROUTE MATCHING                                  */
/* -------------------------------------------------------------------------- */

/**
 * isActivePath
 * --------------------------------------------------------------------------
 * Menentukan apakah suatu menu sedang aktif berdasarkan pathname
 *
 * Aktif jika:
 * - pathname === href
 * - ATAU pathname berada di dalam subtree href
 *   contoh: /gudang/item/1 → aktif untuk /gudang
 *
 * @param {string} pathname
 * @param {string} href
 * @returns {boolean}
 */
export function isActivePath(pathname, href) {
    return (
        pathname === href ||
        (href !== "/" && pathname.startsWith(href + "/"))
    );
}

/* -------------------------------------------------------------------------- */
/*                           MAIN SHARED SIDEBAR HOOK                          */
/* -------------------------------------------------------------------------- */

/**
 * useSidebarMenus
 * --------------------------------------------------------------------------
 * Hook utama yang dipakai semua UI (Sidebar, Home, dll)
 *
 * Output:
 * - me              → user login
 * - displayName     → nama user siap tampil
 * - visibleMenus    → menu yang sudah lolos akses
 * - sectionGroups   → menu dikelompokkan per section
 * - activeMenu      → menu aktif berdasarkan URL
 * - isActive(href)  → helper untuk UI
 * - pathname        → URL aktif
 *
 * @param {object|null} initialUser
 */
export function useSidebarMenus(initialUser) {
    const pathname = usePathname();
    const me = useMe(initialUser);

    /**
     * Filter menu berdasarkan akses user
     */
    const visibleMenus = useMemo(() => {
        return (SIDEBAR_MENUS || []).filter((m) => canMenu(m, me));
    }, [me]);

    /**
     * Group menu berdasarkan section
     * {
     *   "Master": [...],
     *   "Gudang": [...],
     * }
     */
    const sectionGroups = useMemo(() => {
        return visibleMenus.reduce((acc, m) => {
            const section = m.section || "Lainnya";
            (acc[section] ||= []).push(m);
            return acc;
        }, {});
    }, [visibleMenus]);

    /**
     * Menu yang sedang aktif
     */
    const activeMenu = useMemo(() => {
        return (
            visibleMenus.find((m) => isActivePath(pathname, m.href)) || null
        );
    }, [visibleMenus, pathname]);

    /**
     * Nama user untuk ditampilkan di UI
     */
    const displayName = useMemo(() => {
        return (
            (me?.nama && me.nama.trim()) ||
            me?.akun ||
            me?.email ||
            "Pengguna"
        );
    }, [me]);

    return {
        me,
        displayName,
        visibleMenus,
        sectionGroups,
        activeMenu,
        isActive: (href) => isActivePath(pathname, href),
        pathname,
    };
}
