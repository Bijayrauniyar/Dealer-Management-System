import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { InputHTMLAttributes } from "react";
import { formatAmountForInput, roundMoney } from "@/lib/money";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  /** Decimal places when allowDecimal (default 2 for money). */
  decimalPlaces?: number;
  error?: string;
};

/**
 * Number input that shows empty instead of 0 while editing (Karobar-style).
 * Use allowDecimal + decimalPlaces for NPR amounts (paisa).
 */
export const NumericInput = ({
  value,
  onChange,
  min,
  max,
  allowDecimal = false,
  decimalPlaces = 2,
  error,
  onBlur,
  onFocus,
  ...rest
}: Props) => {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  const displayFromValue = useCallback(
    (v: number) => {
      if (v === 0) return "";
      if (allowDecimal) return formatAmountForInput(v, decimalPlaces);
      return String(v);
    },
    [allowDecimal, decimalPlaces],
  );

  useEffect(() => {
    if (!focused) setText(displayFromValue(value));
  }, [value, focused, displayFromValue]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-") {
      onChange(0);
      return;
    }
    let n = allowDecimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
    if (Number.isNaN(n)) return;
    if (allowDecimal) n = roundMoney(n, decimalPlaces);
    let v = n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    onChange(v);
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
        setText(displayFromValue(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        commit(text);
        setFocused(false);
        setText(displayFromValue(value));
        onBlur?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (allowDecimal) {
          if (next === "" || decimalPattern.test(next)) setText(next);
        } else if (next === "" || /^-?\d*$/.test(next)) {
          setText(next);
        }
      }}
    />
  );
};
