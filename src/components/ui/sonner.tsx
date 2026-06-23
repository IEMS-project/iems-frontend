import React from "react"
import { useTheme } from "@/theme/ThemeProvider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentPropsWithoutRef<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:border-2 group-[.toaster]:rounded-lg group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:mt-1 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded group-[.toast]:px-3 group-[.toast]:py-1.5",
        },
        style: {
          background: theme === "dark" 
            ? "rgb(30, 30, 30)" 
            : "rgb(255, 255, 255)",
          border: theme === "dark"
            ? "1px solid rgb(100, 100, 100)"
            : "1px solid rgb(200, 200, 200)",
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
