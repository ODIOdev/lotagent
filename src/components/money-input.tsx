"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { moneyNum } from "@/lib/calc/money";

export function MoneyInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        disabled={disabled}
        className="tabular h-8"
        value={Number.isFinite(value) ? String(value) : "0"}
        onChange={(event) => onChange(moneyNum(event.target.value))}
      />
    </div>
  );
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        className="tabular h-8"
        value={Number.isFinite(value) ? String(value) : "0"}
        onChange={(event) => onChange(moneyNum(event.target.value))}
      />
    </div>
  );
}
