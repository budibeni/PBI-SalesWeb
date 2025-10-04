"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

/**
 * CopyButton – tombol salin serbaguna.
 *
 * Prioritas sumber teks yang disalin:
 *  1) props.text (string)
 *  2) props.getText() -> string | Promise<string>
 *  3) props.fromRef.current (innerText/value/textContent)
 *  4) teks yang sedang terseleksi di halaman (window.getSelection)
 */
export default function CopyButton({
                                       text,
                                       getText,
                                       fromRef,
                                       onCopied,
                                       format,           // optional: (s) => s.trim()
                                       label = "Salin",
                                       successLabel = "Tersalin",
                                       variant = "outline",
                                       size = "sm",
                                       timeoutMs = 1600,
                                       className,
                                       children,         // override label jika ingin kustom
                                       disabled = false,
                                       title,            // tooltip title
                                   }) {
    const [copied, setCopied] = useState(false)

    async function resolveText() {
        if (typeof text === "string") return text
        if (typeof getText === "function") {
            const v = await getText()
            return String(v ?? "")
        }
        if (fromRef?.current) {
            const el = fromRef.current
            return el.innerText || el.value || el.textContent || ""
        }
        if (typeof window !== "undefined") {
            const sel = window.getSelection?.()
            if (sel && String(sel).trim()) return String(sel)
        }
        return ""
    }

    async function handleCopy() {
        try {
            let content = await resolveText()
            if (typeof format === "function") content = format(content)

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(content)
            } else {
                // Fallback non-HTTPS/dev
                const ta = document.createElement("textarea")
                ta.value = content
                ta.style.position = "fixed"
                ta.style.opacity = "0"
                document.body.appendChild(ta)
                ta.select()
                document.execCommand("copy")
                document.body.removeChild(ta)
            }

            setCopied(true)
            onCopied?.(content)
            setTimeout(() => setCopied(false), timeoutMs)
        } catch (e) {
            console.error("Copy failed:", e)
            // Optional: tampilkan toast/alert sesuai kebutuhan app-mu
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleCopy}
            className={className}
            disabled={disabled}
            title={title ?? (copied ? successLabel : label)}
            aria-live="polite"
        >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {children ?? (copied ? successLabel : label)}
            {/* sr-only untuk screen reader saat status berubah */}
            <span className="sr-only">{copied ? successLabel : ""}</span>
        </Button>
    )
}

/* Optional: hook reusable untuk skenario lain */
export function useCopyToClipboard(timeoutMs = 1600) {
    const [copied, setCopied] = useState(false)
    const copy = async (content) => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(String(content ?? ""))
            } else {
                const ta = document.createElement("textarea")
                ta.value = String(content ?? "")
                ta.style.position = "fixed"
                ta.style.opacity = "0"
                document.body.appendChild(ta)
                ta.select()
                document.execCommand("copy")
                document.body.removeChild(ta)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), timeoutMs)
            return true
        } catch (e) {
            console.error("Copy failed:", e)
            return false
        }
    }
    return { copied, copy }
}
