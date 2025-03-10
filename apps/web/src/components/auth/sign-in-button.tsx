import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

interface SignInButtonProps {
  className?: string
}

export function CustomSignInButton({ className }: SignInButtonProps) {
  return (
    <Button variant="outline" className={className}>
      <LogIn className="h-4 w-4 mr-2" />
      Sign In
    </Button>
  )
}
