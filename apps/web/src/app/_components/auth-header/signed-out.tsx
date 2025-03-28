import { CustomSignInButton } from "@/components/auth/sign-in-button";
import { SignInButton, SignedOut as ClerkSignedOut } from "@clerk/nextjs";

export default function SignedOut() {
  return (
    <ClerkSignedOut>
      <SignInButton mode="modal">
        <CustomSignInButton />
      </SignInButton>
    </ClerkSignedOut>
  )
}