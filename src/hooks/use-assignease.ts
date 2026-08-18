import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, signedUrl } from "@/lib/db";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getCurrentProfile,
    staleTime: 60_000,
  });
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
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
  }, []);
  return { userId, loading };
}
