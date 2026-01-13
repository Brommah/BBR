import { Toaster } from "@/components/ui/sonner"

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Public layout without authentication - overrides root layout's GlobalProviders
  return (
    <div className="min-h-screen">
      {children}
      <Toaster />
    </div>
  )
}
