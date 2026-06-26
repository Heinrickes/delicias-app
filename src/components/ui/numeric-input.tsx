"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface NumericInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: number | string
  onChange: (value: string) => void
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, onFocus, onWheel, onChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        className={cn("tabular-nums", className)}
        onFocus={(e) => {
          e.target.select()
          onFocus?.(e)
        }}
        onWheel={(e) => {
          e.currentTarget.blur()
          onWheel?.(e as React.WheelEvent<HTMLInputElement>)
        }}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    )
  }
)
NumericInput.displayName = "NumericInput"

export { NumericInput }
