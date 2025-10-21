"use client";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

/**
 * NumericInput — input angka dengan koma sebagai desimal (format lokal Indonesia)
 * - otomatis ubah titik (.) jadi koma (,)
 * - bisa batasi min/max
 * - tetap pakai gaya shadcn Input
 */
export default function NumericInput({
                                         value,                // numeric string dot-decimal
                                         onValue,              // (strNumeric) => void
                                         min,
                                         max,
                                         decimalScale = 2,
                                         fixedDecimalScale = true,
                                         allowNegative = false,
                                         className,
                                         disabled,
                                         placeholder,
                                         inputMode = "decimal",
                                     }) {
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
            isAllowed={(vals) => {
                const n = Number(vals.value || 0)
                if (min != null && n < min) return false
                if (max != null && n > max) return false
                return true
            }}
            onValueChange={(vals) => onValue?.(vals.value ?? "")}
            disabled={disabled}
            inputMode={inputMode}
            placeholder={placeholder}
            className={className}
        />
    );
}
