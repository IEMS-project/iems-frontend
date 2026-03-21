import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export const FIBONACCI = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

export function isFibonacci(n) {
  if (n === "" || n === null || n === undefined) return true; // blank = OK
  const num = Number(n);
  if (!Number.isInteger(num) || num < 0) return false;
  return FIBONACCI.includes(num);
}

/** Return next Fibonacci after `current` (wraps at 89 → stays 89) */
export function nextFib(current) {
  const num = Number(current);
  const idx = FIBONACCI.findIndex(f => f > num);
  return idx === -1 ? FIBONACCI[FIBONACCI.length - 1] : FIBONACCI[idx];
}

/** Return previous Fibonacci before `current` (floors at 0) */
export function prevFib(current) {
  if (current === "" || current === null || current === undefined) return 0;
  const num = Number(current);
  const idx = [...FIBONACCI].reverse().findIndex(f => f < num);
  return idx === -1 ? FIBONACCI[0] : [...FIBONACCI].reverse()[idx];
}

export default function FibonacciStoryPointInput({
  value,
  onChange,
  className,
  placeholder = "0",
  disabled = false,
  ...rest
}) {
  const [touched, setTouched] = useState(false);

  const isValid = !touched || isFibonacci(value);

  const handleChange = useCallback(
    (e) => {
      setTouched(true);
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = nextFib(value === "" ? -1 : value);
        onChange(String(next));
        setTouched(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const prev = prevFib(value);
        onChange(String(prev));
        setTouched(false);
      }
    },
    [value, onChange]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  return (
    <div className="relative w-full">
      <input
        type="number"
        min={0}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full",
          !isValid && "border-red-500 focus:ring-red-400 text-red-600",
          className
        )}
        {...rest}
      />
      {!isValid && (
        <p className="mt-1 text-xs text-red-500 leading-tight">
          Story Points must be a Fibonacci number: 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
        </p>
      )}
    </div>
  );
}
