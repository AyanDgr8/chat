// src/components/SignInWithClerk.tsx

import { useAuth } from "@clerk/nextjs";
import { signInWithCustomToken, getAuth } from "firebase/auth";

const SignInWithClerk = () => {
  const { getToken } = useAuth();

  const signIn = async () => {
    const token = await getToken({ template: "integration_firebase" });
    const auth = getAuth();
    await signInWithCustomToken(auth, token || "");
  };

  return <button onClick={signIn}>Sign in with Clerk</button>;
};

export default SignInWithClerk;


