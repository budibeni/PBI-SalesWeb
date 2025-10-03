"use client";
import { useEffect, useState } from "react";

/**
 * Hook untuk membaca tinggi visualViewport (bagian layar yang tersisa saat keyboard muncul).
 * Sangat berguna untuk mobile keyboard-safe UI.
 *
 * @param {boolean} active - hanya aktif saat dialog/popover terbuka
 * @returns {number} tinggi viewport (px)
 */
export default function useVisualViewportSize(active = true) {
    const [vh, setVh] = useState(
        typeof window !== "undefined" ? window.innerHeight : 0
    );

    useEffect(() => {
        if (!active) return;
        const vv = window.visualViewport;
        if (!vv) return;

        const update = () => setVh(vv.height);

        update();
        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);

        return () => {
            vv.removeEventListener("resize", update);
            vv.removeEventListener("scroll", update);
        };
    }, [active]);

    return vh;
}
