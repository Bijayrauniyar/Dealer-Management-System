import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { InputHTMLAttributes } from "react";
import { formatAmountForInput, roundMoney } from "@/lib/money";

type NumericInputBase = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  /** Decimal places when allowDecimal (default 2 for money). */
  decimalPlaces?: number;
  /** When true, show "0" instead of blank (default: blank for 0, Karobar-style). */
  showZero?: boolean;
  error?: string;
};

type NumericInputProps = NumericInputBase & {
  nullable?: false;
  value: number;
  onChange: (value: number) => void;
};

type NullableNumericInputProps = NumericInputBase & {
  nullable: true;
  value: number | null;
  onChange: (value: number | null) => void;
};

type Props = NumericInputProps | NullableNumericInputProps;

/**
 * Number input that shows empty instead of 0 while editing (Karobar-style).
 * Use nullable + showZero for markup % (empty = unset, 0 = explicit zero).
 */
export const NumericInput = ({
  value,
  onChange,
  min,
  max,
  allowDecimal = false,
  decimalPlaces = 2,
  showZero = false,
  nullable = false,
  error,
  onBlur,
  onFocus,
  ...rest
}: Props) => {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  /** Plain string for editing — no thousand separators (commas break decimal typing). */
  const editStringFromValue = useCallback(
    (v: number | null) => {
      if (v === null) return "";
      if (v === 0) return showZero ? "0" : "";
      if (allowDecimal) {
        const r = roundMoney(v, decimalPlaces);
        const s = r.toFixed(decimalPlaces);
        return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      }
      return String(v);
    },
    [allowDecimal, decimalPlaces, showZero],
  );

  const displayFromValue = useCallback(
    (v: number | null) => {
      if (v === null) return "";
      if (v === 0) return showZero ? "0" : "";
      if (allowDecimal) return formatAmountForInput(v, decimalPlaces);
      return String(v);
    },
    [allowDecimal, decimalPlaces, showZero],
  );

  useEffect(() => {
    if (!focused) setText(displayFromValue(value));
  }, [value, focused, displayFromValue]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-") {
      if (nullable) {
        (onChange as (v: number | null) => void)(null);
      } else {
        (onChange as (v: number) => void)(0);
      }
      return;
    }
    let n = allowDecimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
    if (Number.isNaN(n)) return;
    if (allowDecimal) n = roundMoney(n, decimalPlaces);
    let v = n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    if (nullable) {
      (onChange as (v: number | null) => void)(v);
    } else {
      (onChange as (v: number) => void)(v);
    }
  };

  const decimalPattern =
    decimalPlaces > 0
      ? new RegExp(`^-?\\d*(?:\\.\\d{0,${decimalPlaces}})?$`)
      : /^-?\d*$/;

  return (
    <Input
      {...rest}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      error={error}
      value={focused ? text : displayFromValue(value)}
      onFocus={(e) => {
        setFocused(true);
        setText(editStringFromValue(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        commit(text);
        setFocused(false);
        setText(displayFromValue(value));
        onBlur?.(e);
      }}
      onChange={(e) => {
        let next = e.target.value.replace(/,/g, "");
        if (allowDecimal && next.includes(".")) {
          const [whole, frac = ""] = next.split(".");
          if (frac.length > decimalPlaces) {
            next = `${whole}.${frac.slice(0, decimalPlaces)}`;
          }
        }
        if (allowDecimal) {
          if (next === "" || decimalPattern.test(next)) setText(next);
        } else if (next === "" || /^-?\d*$/.test(next)) {
          setText(next);
        }
      }}
    />
  );
};
