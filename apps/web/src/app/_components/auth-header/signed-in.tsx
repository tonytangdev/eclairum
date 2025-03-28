import { fetchOnGoingQuizGenerationTasks } from "@/app/_actions/fetch-quiz-generation-tasks";
import { NotificationBell } from "@/components/notification-bell";
import { SignedIn as ClerkSignedIn, UserButton } from "@clerk/nextjs";

export default async function SignedIn() {
  const onGoingTasks = await fetchOnGoingQuizGenerationTasks()
  console.log("onGoingTasks", onGoingTasks)
  return (
    <ClerkSignedIn>
      <NotificationBell />
      <UserButton />
    </ClerkSignedIn>
  )
}