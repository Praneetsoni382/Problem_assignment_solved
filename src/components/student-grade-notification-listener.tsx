import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useProfile } from "@/hooks/use-assignease";

/**
 * Background listener that silently syncs notifications and submission updates
 * without popping disruptive modal toasts on screen or when logging in.
 */
export function StudentGradeNotificationListener() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profile?.id || profile.role !== "student") return;

    // Silently sync real-time notifications for the bell badge
    const notifQuery = query(collection(db, "notifications"), where("user_id", "==", profile.id));
    const unsubNotif = onSnapshot(notifQuery, () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["question-marks"] });
    });

    // Silently sync real-time submissions updates
    const subQuery = query(collection(db, "submissions"), where("student_id", "==", profile.id));
    const unsubSub = onSnapshot(subQuery, () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["my-submission"] });
    });

    return () => {
      unsubNotif();
      unsubSub();
    };
  }, [profile?.id, profile?.role, queryClient]);

  return null;
}
