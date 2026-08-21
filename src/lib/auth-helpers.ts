import { GoogleAuthProvider, signInWithPopup, signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Profile } from "./db";

/**
 * Sign in using Google Popup and ensure Firestore profile exists
 */
export async function signInWithGoogle(
  intendedRole?: "student" | "teacher",
  details?: { fullName?: string; enrollmentNo?: string | null },
): Promise<{ user: User; profile: Profile; isNew: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check if profile already exists in Firestore
  const profileRef = doc(db, "profiles", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    const existingProfile = { id: profileSnap.id, ...(profileSnap.data() as Omit<Profile, "id">) };
    return { user, profile: existingProfile, isNew: false };
  }

  // Create new profile with specified role or fallback to student
  const role = intendedRole || "student";
  const fullName = details?.fullName?.trim() || user.displayName?.trim() || "User";
  const enrollmentNo = role === "student" ? details?.enrollmentNo?.trim() || "014202" : null;

  const newProfile: Profile = {
    id: user.uid,
    email: user.email || "",
    full_name: fullName,
    role,
    enrollment_no: enrollmentNo,
    created_at: new Date().toISOString(),
  };

  await setDoc(profileRef, newProfile);
  return { user, profile: newProfile, isNew: true };
}

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
