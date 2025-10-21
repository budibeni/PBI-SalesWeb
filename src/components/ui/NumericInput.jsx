// components/NumericInput.jsx
"use client";
import React from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

/**
 * NumericInput
 * - Tampil: ribuan "." & desimal ","
 * - State (keluar/masuk): numeric string dot-decimal (contoh "1234.56" atau "")
 * - Tidak pakai min/max ketat saat mengetik; clamp & round dilakukan saat blur
 */
export default function NumericInput({
                                         value,                // string "1234.56" atau ""
                                         onValue,              // (strNumeric) => void
                                         softMin,              // number | undefined
                                         softMax,              // number | undefined
                                         decimalScale = 2,
                                         fixedDecimalScale = true,   // set false kalau tak mau otomatis ",00"
                                         allowNegative = false,
                                         className,
                                         disabled,
                                         placeholder,
                                         inputMode = "decimal",
                                     }) {
    // simpan angka terakhir yang valid dari onValueChange (bukan yang sudah diformat UI)
    const lastFloatRef = React.useRef(undefined);

    // helper pembulatan 2 desimal
    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    // clamp number (tanpa memblokir ketikan user)
    const clamp = (n) => {
        if (n == null || Number.isNaN(n)) return undefined;
        let x = n;
        if (typeof softMin === "number") x = Math.max(softMin, x);
        if (typeof softMax === "number") x = Math.min(softMax, x);
        return round2(x);
    };

    // cek apakah butuh membulatkan (lebih dari 2 desimal)
    const needsRound2 = (n) => {
        if (!Number.isFinite(n)) return false;
        const s = String(n);
        const i = s.indexOf(".");
        return i !== -1 && s.length - i - 1 > 2;
    };

    return (
        <NumericFormat
            value={value ?? ""}
            valueIsNumericString
            customInput={Input}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={allowNegative}
            // izinkan semua saat mengetik (supaya tidak “mengunci” ketika user menghapus)
            isAllowed={() => true}
            onValueChange={(vals) => {
                // vals.value = numeric string dot-decimal (atau "" saat kosong)
                // vals.floatValue = number | undefined
                lastFloatRef.current = vals.floatValue;
                onValue?.(vals.value ?? "");
            }}
            onBlur={() => {
                // Gunakan float terakhir yang valid untuk clamp & round
                let n = lastFloatRef.current;

                // jika kosong, jangan paksa angka besar; biarkan "" (UI/logic kamu bisa putuskan nanti)
                if (n == null || Number.isNaN(n)) {
                    onValue?.("");
                    return;
                }

                // Kalau di luar batas → clamp. Kalau >2 desimal → round2.
                const inRange =
                    (typeof softMin !== "number" || n >= softMin) &&
                    (typeof softMax !== "number" || n <= softMax);

                const mustRound = needsRound2(n);

                if (!inRange || mustRound) {
                    const c = clamp(n);
                    onValue?.(String(c ?? n));
                } else {
                    // sudah aman → jangan ubah supaya tidak terasa "berubah sendiri"
                    onValue?.(String(n));
                }
            }}
            disabled={disabled}
            inputMode={inputMode}
            placeholder={placeholder}
            className={className}
        />
    );
}
