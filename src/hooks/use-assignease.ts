import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getCurrentProfile, signedUrl, type Profile } from "@/lib/db";
import { getLocalSession, setLocalSession } from "@/lib/auth-service";

export function useProfile() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getCurrentProfile,
    staleTime: 10_000,
  });

  useEffect(() => {
    const user = auth.currentUser;
    const local = getLocalSession();
    const targetUid = user?.uid || local?.id;
    if (!targetUid) return;

    const unsub = onSnapshot(
      doc(db, "profiles", targetUid),
      (snap) => {
        if (!snap.exists()) {
          // Profile was deleted in database (e.g. by teacher)
          setLocalSession(null);
          queryClient.setQueryData(["profile"], null);
        } else {
          const p = { id: snap.id, ...(snap.data() as Omit<Profile, "id">) };
          setLocalSession(p);
          queryClient.setQueryData(["profile"], p);
        }
      },
      (err) => {
        console.warn("Profile sync notice:", err);
      },
    );

    return () => unsub();
  }, [queryClient]);

  return profileQuery;
}

export function useSignedUrl(
  bucket: "submission-scans" | "question-papers",
  path: string | null | undefined,
) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    signedUrl(bucket, path).then((value) => {
      if (active) setUrl(value);
    });
    return () => {
      active = false;
    };
  }, [bucket, path]);
  return url;
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserId(firebaseUser?.uid ?? null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, userId, loading };
}
