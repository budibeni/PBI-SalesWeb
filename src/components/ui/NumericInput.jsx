// components/NumericInput.jsx
"use client";
import React from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

export default function NumericInput({
                                         value,
                                         onValue,
                                         softMin,
                                         softMax,
                                         decimalScale = 2,
                                         fixedDecimalScale = true,
                                         allowNegative = false,
                                         className,
                                         disabled,
                                         placeholder,
                                         inputMode = "decimal",
                                         allowDecimal = true,
                                     }) {
    const lastFloatRef = React.useRef(undefined);

    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    const clamp = (n) => {
        if (n == null || Number.isNaN(n)) return undefined;
        let x = n;
        if (typeof softMin === "number") x = Math.max(softMin, x);
        if (typeof softMax === "number") x = Math.min(softMax, x);
        return round2(x);
    };

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
            decimalScale={allowDecimal ? decimalScale : 0}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={allowNegative}
            isAllowed={(vals) => {
                if (!allowDecimal) {
                    const raw = String(vals?.value ?? "");
                    // NumericFormat selalu pakai DOT untuk value numerik
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
                const mustRound = needsRound2(n);
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
