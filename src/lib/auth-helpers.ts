import { signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Profile } from "./db";

/**
 * Instant 1-Click Demo Login for previewing functionality
 */
export async function signInDemoUser(
  role: "student" | "teacher",
): Promise<{ user: User; profile: Profile }> {
  const cred = await signInAnonymously(auth);
  const user = cred.user;

  const profileRef = doc(db, "profiles", user.uid);
  const profileSnap = await getDoc(profileRef);

  const demoFullName = role === "teacher" ? "Prof. Alex Vance (Demo)" : "Rohan Verma (Demo)";
  const demoEnrollmentNo = role === "student" ? "014202" : null;
  const demoEmail =
    role === "teacher" ? "teacher.demo@assignease.edu" : "student.demo@assignease.edu";

  if (profileSnap.exists()) {
    const existing = { id: profileSnap.id, ...(profileSnap.data() as Omit<Profile, "id">) };
    if (existing.role !== role) {
      await setDoc(
        profileRef,
        { ...existing, role, full_name: demoFullName, enrollment_no: demoEnrollmentNo },
        { merge: true },
      );
      existing.role = role;
      existing.full_name = demoFullName;
      existing.enrollment_no = demoEnrollmentNo;
    }
    return { user, profile: existing };
  }

  const demoProfile: Profile = {
    id: user.uid,
    email: demoEmail,
    full_name: demoFullName,
    role,
    enrollment_no: demoEnrollmentNo,
    created_at: new Date().toISOString(),
  };

  await setDoc(profileRef, demoProfile);
  return { user, profile: demoProfile };
}

/**
 * Check if the Firebase error is auth/operation-not-allowed
 */
export function isOperationNotAllowedError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const message = (error as Error)?.message || "";
  return (
    code === "auth/operation-not-allowed" ||
    message.includes("auth/operation-not-allowed") ||
    message.includes("operation-not-allowed")
  );
}
