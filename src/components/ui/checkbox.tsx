import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type PrimitiveProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

const PrimitiveCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  PrimitiveProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
PrimitiveCheckbox.displayName = CheckboxPrimitive.Root.displayName

type CheckboxProps = PrimitiveProps & {
  label?: React.ReactNode
  // Accept traditional checked/onChange signature used across the codebase
  checked?: boolean
  onChange?: (e: { target: { checked: boolean } }) => void
  className?: string
}

const Checkbox = ({ label, checked, onChange, className, ...rest }: CheckboxProps) => {
  const handleCheckedChange = (value: boolean | "indeterminate") => {
    if (typeof onChange === "function") {
      onChange({ target: { checked: Boolean(value) } })
    }
  }

  if (label) {
    return (
      <label className={cn("flex items-center gap-2 px-2 py-1 cursor-pointer w-full", className)}>
        <PrimitiveCheckbox checked={checked} onCheckedChange={handleCheckedChange} {...rest} />
        <span className="text-sm truncate">{label}</span>
      </label>
    )
  }

  return <PrimitiveCheckbox checked={checked} onCheckedChange={handleCheckedChange} className={className} {...rest} />
}

export { Checkbox }
export default Checkbox
