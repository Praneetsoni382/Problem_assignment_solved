import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentProfile } from "@/lib/db";

async function getAuthenticatedUser() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return profile;
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
