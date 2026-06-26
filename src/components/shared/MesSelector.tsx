"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type MesOpt = { value: string; label: string };

export function MesSelector({
  value,
  meses,
}: {
  value: string;
  meses: MesOpt[];
}) {
  const router = useRouter();
  return (
    <Select value={value} onValueChange={(v) => v && router.push(`/?mes=${v}`)}>
      <SelectTrigger className="h-9">
        <span className="text-sm font-medium text-foreground">
          {meses.find((m) => m.value === value)?.label ?? value}
        </span>
      </SelectTrigger>
      <SelectContent>
        {meses.map((m) => (
          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
