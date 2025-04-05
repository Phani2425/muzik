import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "hsl(222.2 84% 4.9%)", 
          "--normal-border": "var(--border)",
          "--normal-description": "hsl(215 16% 47%)", 
          "--success-bg": "hsl(143.8 69.5% 95%)",
          "--success-text": "hsl(142.1 70.6% 45.3%)",
          "--error-bg": "hsl(0 84.2% 95.2%)",
          "--error-text": "hsl(0 72.2% 50.6%)",
          "--toast-shadow": "0 2px 8px rgba(0, 0, 0, 0.08)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          description: "text-[var(--normal-description)] text-sm mt-1"
        }
      }}
      {...props}
    />
  )
}

export { Toaster }