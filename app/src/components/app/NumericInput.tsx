import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  error?: string;
};

/**
 * Number input that shows empty instead of 0 while editing (Karobar-style).
 * Use this instead of &lt;Input type="number" value={n} onChange={e =&gt; setN(Number(e.target.value))} /&gt;
 * — native number inputs cannot be cleared when the value is 0.
 */
export const NumericInput = ({
  value,
  onChange,
  min,
  max,
  allowDecimal = false,
  error,
  onBlur,
  onFocus,
  ...rest
}: Props) => {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  const displayFromValue = useCallback(
    (v: number) => (v === 0 ? "" : String(v)),
    [],
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
    const n = allowDecimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
    if (Number.isNaN(n)) return;
    let v = n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    onChange(v);
  };

  return (
    <Input
      {...rest}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      error={error}
      value={focused ? text : displayFromValue(value)}
      onFocus={(e) => {
        setFocused(true);
        setText(value === 0 ? "" : String(value));
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
          if (next === "" || /^-?\d*\.?\d*$/.test(next)) setText(next);
        } else if (next === "" || /^-?\d*$/.test(next)) {
          setText(next);
        }
      }}
    />
  );
};
