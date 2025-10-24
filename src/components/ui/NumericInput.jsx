"use client";
import React from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

export default function NumericInput({
                                         value,
                                         onValue,
                                         softMin,
                                         softMax,
                                         decimalScale = 6, // default lebih tinggi agar tidak hilang angka kecil
                                         fixedDecimalScale = false,
                                         allowNegative = false,
                                         className,
                                         disabled,
                                         placeholder,
                                         inputMode = "decimal",
                                         allowDecimal = true,
                                     }) {
    const lastFloatRef = React.useRef(undefined);

    // gunakan scale dinamis
    const roundTo = (n, scale = decimalScale) => {
        const factor = 10 ** scale;
        return Math.round((Number(n) || 0) * factor) / factor;
    };

    const clamp = (n) => {
        if (n == null || Number.isNaN(n)) return undefined;
        let x = n;
        if (typeof softMin === "number") x = Math.max(softMin, x);
        if (typeof softMax === "number") x = Math.min(softMax, x);
        return roundTo(x);
    };

    const needsRound = (n) => {
        if (!Number.isFinite(n)) return false;
        const s = String(n);
        const i = s.indexOf(".");
        return i !== -1 && s.length - i - 1 > decimalScale;
    };

    return (
        <NumericFormat
            value={value ?? ""}
            valueIsNumericString
            customInput={Input}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={allowDecimal ? decimalScale : 0}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={allowNegative}
            isAllowed={(vals) => {
                if (!allowDecimal) {
                    const raw = String(vals?.value ?? "");
                    if (raw.includes(".")) return false;
                }
                return true;
            }}
            onValueChange={(vals) => {
                lastFloatRef.current = vals.floatValue;
                onValue?.(vals.value ?? "");
            }}
            onBlur={() => {
                let n = lastFloatRef.current;
                if (n == null || Number.isNaN(n)) {
                    onValue?.("");
                    return;
                }
                const inRange =
                    (typeof softMin !== "number" || n >= softMin) &&
                    (typeof softMax !== "number" || n <= softMax);
                const mustRound = needsRound(n);
                if (!inRange || mustRound) {
                    const c = clamp(n);
                    onValue?.(String(c ?? n));
                } else {
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
