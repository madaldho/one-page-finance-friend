
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
      <input
        type={type}
        className={cn(
            // Set font-size 16px minimum for all number/currency fields on mobile to prevent zoom
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:text-sm",
            "mobile-input:text-base", // custom utility, ensure 16px (base) font on mobile
            error ? "border-red-500" : "",
          className
        )}
        style={{
          fontSize: "16px", // ensure minimum font size to prevent mobile zoom
        }}
        ref={ref}
        {...props}
      />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
