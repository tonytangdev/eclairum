
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { CustomSignInButton } from "@/components/auth/sign-in-button";
import { NotificationBell } from "@/components/notification-bell";

/**
 * Component for displaying authentication-related elements in the header
 * Shows sign-in button for non-authenticated users and user profile/notification bell for signed-in users
 */
export function AuthHeader() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <CustomSignInButton />
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <NotificationBell />
        <UserButton />
      </SignedIn>
    </>
  );
}