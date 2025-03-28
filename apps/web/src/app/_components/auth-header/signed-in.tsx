import { NotificationBell } from "@/components/notification-bell";
import { SignedIn as ClerkSignedIn, UserButton } from "@clerk/nextjs";

export default function SignedIn() {
  return (
    <ClerkSignedIn>
      <NotificationBell />
      <UserButton />
    </ClerkSignedIn>
  )
}