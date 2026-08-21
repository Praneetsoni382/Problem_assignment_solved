import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getLocalSession } from "@/lib/auth-service";

async function getAuthenticatedUser() {
  const local = getLocalSession();
  if (local) return local;
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user || getLocalSession());
    });
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw redirect({ to: "/" });
    return { user };
  },
  component: () => <Outlet />,
});
