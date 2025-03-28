import SignedIn from "./signed-in";
import SignedOut from "./Signed-out";



/**
 * Component for displaying authentication-related elements in the header
 * Shows sign-in button for non-authenticated users and user profile/notification bell for signed-in users
 */
export async function AuthHeader() {
  return (
    <>
      <SignedOut />
      <SignedIn />
    </>
  );
}