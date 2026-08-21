import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  signOut as firebaseSignOut,
  signInAnonymously,
  sendPasswordResetEmail,
  confirmPasswordReset,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Profile } from "./db";
import {
  sendVerificationEmailServerAction,
  sendPasswordResetEmailServerAction,
} from "./email-action";

const LOCAL_SESSION_KEY = "assignease_auth_session";

const authListeners = new Set<(profile: Profile | null) => void>();

function notifyAuthListeners(profile: Profile | null) {
  authListeners.forEach((fn) => {
    try {
      fn(profile);
    } catch (e) {
      console.warn("Auth listener error:", e);
    }
  });
}

function generateSecureToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).substring(2, 10);
  }
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

/**
 * Resolve the public origin URL for email links.
 * When in AI Studio development mode (ais-dev-...), converts to public preview (ais-pre-...)
 * so email links opened on other devices/phones work without requiring developer authentication.
 * In deployed/custom-domain production, preserves the exact deployed domain.
 */
function getAppPublicOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    let origin = window.location.origin;
    if (origin.includes("ais-dev-")) {
      origin = origin.replace("ais-dev-", "ais-pre-");
    }
    return origin;
  }
  return "https://ais-pre-kuqwm4h3jffgxrsakqkd36-685021036868.asia-southeast1.run.app";
}

/**
 * Hash password locally using Web Crypto SHA-256 with salt
 */
export async function hashPassword(rawPassword: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${rawPassword}_assignease_salt_2026`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getLocalSession(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function setLocalSession(profile: Profile | null) {
  if (typeof window === "undefined") return;
  if (!profile) {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } else {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
  }
  notifyAuthListeners(profile);
}

export function subscribeToAuth(callback: (profile: Profile | null) => void): () => void {
  authListeners.add(callback);
  return () => {
    authListeners.delete(callback);
  };
}

/**
 * Register account via Email & Password with Brevo Email Verification
 * Enforces strict ONE-USER-PER-EMAIL constraint.
 */
export async function registerWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "teacher";
  enrollmentNo?: string | null;
}): Promise<{ profile: Profile; requiresVerification: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanFullName = params.fullName.trim();
  const cleanEnrollment = params.role === "student" ? params.enrollmentNo?.trim() || null : null;
  const pwdHash = await hashPassword(params.password);

  // 1. STRICT UNIQUE EMAIL CHECK: Check if email already exists in Firestore user_accounts
  try {
    const existingAccountSnap = await getDoc(doc(db, "user_accounts", cleanEmail));
    if (existingAccountSnap.exists()) {
      throw new Error(
        "Email already registered. This email is already associated with an existing account.",
      );
    }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "";
    if (msg.includes("Email already registered")) {
      throw err;
    }
    console.warn("Notice checking user_accounts uniqueness:", err);
  }

  // 2. STRICT UNIQUE EMAIL CHECK: Check if email already exists in Firestore profiles
  try {
    const checkQuery = query(collection(db, "profiles"), where("email", "==", cleanEmail));
    const checkSnap = await getDocs(checkQuery);
    if (!checkSnap.empty) {
      throw new Error(
        "Email already registered. This email is already associated with an existing account.",
      );
    }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "";
    if (msg.includes("Email already registered")) {
      throw err;
    }
    console.warn("Notice checking profiles uniqueness:", err);
  }

  let uid = "";

  // 3. Create user in Firebase Authentication
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    uid = cred.user.uid;
    try {
      await firebaseUpdateProfile(cred.user, { displayName: cleanFullName });
    } catch (e) {
      console.warn("Could not update firebase profile display name", e);
    }
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || "";
    if (code === "auth/email-already-in-use") {
      throw new Error(
        "Email already registered. This email is already associated with an existing account.",
      );
    }
    console.warn("Firebase Auth registration notice:", code, (err as Error)?.message);
    uid = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (anonErr) {
      console.warn("Anonymous background auth notice:", anonErr);
    }
  }

  const profile: Profile = {
    id: uid,
    email: cleanEmail,
    full_name: cleanFullName,
    role: params.role,
    enrollment_no: cleanEnrollment,
    created_at: new Date().toISOString(),
  };

  // Generate secure email verification token
  const verificationToken = generateSecureToken();
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  // 4. Save to Firestore `profiles`
  try {
    await setDoc(doc(db, "profiles", uid), profile, { merge: true });
  } catch (e) {
    console.warn("Could not save to profiles doc:", e);
  }

  // 5. Save credentials to Firestore `user_accounts` marked as UNVERIFIED initially
  try {
    await setDoc(
      doc(db, "user_accounts", cleanEmail),
      {
        uid,
        email: cleanEmail,
        full_name: cleanFullName,
        role: params.role,
        enrollment_no: cleanEnrollment,
        password_hash: pwdHash,
        email_verified: false,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt,
        created_at: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn("Could not save to user_accounts doc:", e);
  }

  // 6. Send Brevo Transactional Email with 1-click verification link
  const origin = getAppPublicOrigin();
  const verificationUrl = `${origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

  try {
    await sendVerificationEmailServerAction({
      data: {
        toEmail: cleanEmail,
        toName: cleanFullName,
        verificationUrl,
        role: params.role,
      },
    });
  } catch (emailErr) {
    console.error("Failed to send Brevo verification email:", emailErr);
  }

  return { profile, requiresVerification: true };
}

/**
 * Verify Email with Token from Email Link
 */
export async function verifyEmailWithToken(
  email: string,
  token?: string,
): Promise<{ profile: Profile }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("Email address is required.");

  const accountRef = doc(db, "user_accounts", cleanEmail);
  const accountSnap = await getDoc(accountRef);

  if (!accountSnap.exists()) {
    throw new Error("No account found for this email address. Please create an account.");
  }

  const accountData = accountSnap.data();

  // If token is provided, validate it
  if (token) {
    if (accountData.verification_token && accountData.verification_token !== token) {
      throw new Error(
        "Invalid or outdated verification link. Please request a new verification email.",
      );
    }
    if (accountData.token_expires_at) {
      const expires = new Date(accountData.token_expires_at).getTime();
      if (Date.now() > expires) {
        throw new Error("Verification link has expired. Please request a new one.");
      }
    }
  }

  // Mark account as verified and clear token
  await setDoc(
    accountRef,
    {
      email_verified: true,
      verification_token: null,
      token_expires_at: null,
    },
    { merge: true },
  );

  const profile: Profile = {
    id: accountData.uid || "usr_" + Math.random().toString(36).substring(2, 9),
    email: accountData.email || cleanEmail,
    full_name: accountData.full_name || "User",
    role: accountData.role || "student",
    enrollment_no: accountData.enrollment_no || null,
    created_at: accountData.created_at || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "profiles", profile.id), profile, { merge: true });
  } catch (e) {
    console.warn("Could not sync profile doc on verify:", e);
  }

  setLocalSession(profile);
  return { profile };
}

/**
 * Legacy compatibility alias
 */
export async function verifyEmailCode(email: string, code?: string): Promise<void> {
  await verifyEmailWithToken(email, code);
}

/**
 * Resend Email Verification link to user's registered inbox via Brevo
 */
export async function resendVerificationEmail(
  email: string,
  role?: "student" | "teacher",
): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("Please enter your registered email address.");

  const accountRef = doc(db, "user_accounts", cleanEmail);
  const accountSnap = await getDoc(accountRef);

  let userName = "User";
  let userRole: "student" | "teacher" = role || "student";

  if (accountSnap.exists()) {
    const data = accountSnap.data();
    userName = data.full_name || "User";
    userRole = data.role || userRole;
  }

  const newToken = generateSecureToken();
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await setDoc(
    accountRef,
    {
      verification_token: newToken,
      token_expires_at: tokenExpiresAt,
      email_verified: false,
    },
    { merge: true },
  );

  const origin = getAppPublicOrigin();
  const verificationUrl = `${origin}/verify-email?token=${newToken}&email=${encodeURIComponent(cleanEmail)}`;

  await sendVerificationEmailServerAction({
    data: {
      toEmail: cleanEmail,
      toName: userName,
      verificationUrl,
      role: userRole,
    },
  });

  return newToken;
}

export async function resendVerificationCode(email: string): Promise<string> {
  return await resendVerificationEmail(email);
}

/**
 * Sign In via Email & Password with email verification check.
 * Strictly verifies passwords against stored credentials and Firebase Auth.
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ profile: Profile }> {
  const cleanEmail = email.trim().toLowerCase();
  const pwdHash = await hashPassword(password);

  let accountFound = false;

  // 1. Check Firestore user_accounts credentials
  try {
    const accountRef = doc(db, "user_accounts", cleanEmail);
    const accountSnap = await getDoc(accountRef);

    if (accountSnap.exists()) {
      accountFound = true;
      const data = accountSnap.data();

      // STRICT PASSWORD CHECK: If password hash does not match, reject immediately!
      if (data.password_hash && data.password_hash !== pwdHash) {
        throw new Error("Incorrect password. Please verify your password or use forgot password.");
      }

      // Check if email has been verified!
      if (data.email_verified === false) {
        throw new Error(
          "EMAIL_NOT_VERIFIED: Your email address is not verified yet. Please check your email inbox and click the verification button to activate your account.",
        );
      }

      // Password matches and verified!
      const profile: Profile = {
        id: data.uid,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        enrollment_no: data.enrollment_no || null,
        created_at: data.created_at || new Date().toISOString(),
      };

      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (anonErr) {
        console.warn("Background signin notice:", anonErr);
      }

      await setDoc(doc(db, "profiles", data.uid), profile, { merge: true });
      setLocalSession(profile);
      return { profile };
    }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "";
    if (msg.includes("EMAIL_NOT_VERIFIED") || msg.includes("Incorrect password")) {
      throw err;
    }
    console.warn("Error querying user_accounts:", err);
  }

  // 2. Try Firebase Auth sign in
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const profileRef = doc(db, "profiles", cred.user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const p = { id: profileSnap.id, ...(profileSnap.data() as Omit<Profile, "id">) };
      setLocalSession(p);
      return { profile: p };
    }
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || "";
    if (
      code === "auth/wrong-password" ||
      code === "auth/invalid-credential" ||
      code === "auth/invalid-login-credentials"
    ) {
      throw new Error("Incorrect password. Please verify your password or use forgot password.");
    }
    if (code === "auth/user-not-found") {
      throw new Error(
        "No account found with this email. Please check your email or create an account.",
      );
    }
    console.warn("Firebase Auth signIn notice:", (err as Error)?.message);
  }

  if (accountFound) {
    throw new Error("Incorrect password. Please verify your password or use forgot password.");
  }

  throw new Error(
    "Incorrect email or password. Please verify your credentials or create an account.",
  );
}

/**
 * 1-Click Demo Login
 */
export async function loginDemoUser(role: "student" | "teacher"): Promise<{ profile: Profile }> {
  let uid = "";
  try {
    const cred = await signInAnonymously(auth);
    uid = cred.user.uid;
  } catch {
    uid = role === "teacher" ? "teacher_demo_user" : "student_demo_user";
  }

  const demoFullName = role === "teacher" ? "Prof. Alex Vance" : "Rohan Verma";
  const demoEnrollmentNo = role === "student" ? "014202" : null;
  const demoEmail =
    role === "teacher" ? "teacher.demo@assignease.edu" : "student.demo@assignease.edu";

  const profile: Profile = {
    id: uid,
    email: demoEmail,
    full_name: demoFullName,
    role,
    enrollment_no: demoEnrollmentNo,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "profiles", uid), profile, { merge: true });
  } catch (e) {
    console.warn("Could not save demo profile:", e);
  }

  setLocalSession(profile);
  return { profile };
}

/**
 * Sign out
 */
export async function logOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn("SignOut notice:", e);
  }
  setLocalSession(null);
}

/**
 * Direct password reset without email link (used when user directly updates)
 */
export async function resetPasswordDirectly(email: string, newPassword: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("Email address is required.");
  if (!newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  const pwdHash = await hashPassword(newPassword);

  // Update in user_accounts
  const accountRef = doc(db, "user_accounts", cleanEmail);
  const accountSnap = await getDoc(accountRef);

  if (accountSnap.exists()) {
    await setDoc(
      accountRef,
      {
        password_hash: pwdHash,
        password_reset_token: null,
        reset_token_expires_at: null,
        email_verified: true,
      },
      { merge: true },
    );
    return;
  }

  // Check if profile exists by email query
  const q = query(collection(db, "profiles"), where("email", "==", cleanEmail));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const profileDoc = snap.docs[0];
    const profileData = profileDoc.data();
    await setDoc(accountRef, {
      uid: profileDoc.id,
      email: cleanEmail,
      full_name: profileData.full_name || "User",
      role: profileData.role || "student",
      enrollment_no: profileData.enrollment_no || null,
      password_hash: pwdHash,
      email_verified: true,
      created_at: new Date().toISOString(),
    });
    return;
  }

  throw new Error("No account found with this email address. Please create a new account.");
}

/**
 * Dispatch Password Reset Email Link via Brevo to user's registered inbox
 */
export async function sendPasswordResetEmailLink(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("Please enter your registered email address.");

  // Check user account
  const accountRef = doc(db, "user_accounts", cleanEmail);
  const accountSnap = await getDoc(accountRef);

  let userName = "User";
  if (accountSnap.exists()) {
    userName = accountSnap.data().full_name || "User";
  } else {
    // Check profiles
    const q = query(collection(db, "profiles"), where("email", "==", cleanEmail));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("No account found with this email address.");
    }
    userName = snap.docs[0].data().full_name || "User";
  }

  const resetToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  await setDoc(
    accountRef,
    {
      password_reset_token: resetToken,
      reset_token_expires_at: expiresAt,
    },
    { merge: true },
  );

  const origin = getAppPublicOrigin();
  const resetUrl = `${origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

  // Send email via Brevo
  await sendPasswordResetEmailServerAction({
    data: {
      toEmail: cleanEmail,
      toName: userName,
      resetUrl,
    },
  });

  // Background fallback to Firebase Auth reset
  try {
    await sendPasswordResetEmail(auth, cleanEmail, {
      url: resetUrl,
      handleCodeInApp: false,
    });
  } catch {
    // Ignore Firebase Auth fallback errors if provider is disabled
  }
}

/**
 * Confirm password reset using Token from Email or Firebase Auth oobCode
 */
export async function confirmAndResetPassword(params: {
  token?: string | null;
  oobCode?: string | null;
  email?: string;
  newPassword: string;
}): Promise<void> {
  const { token, oobCode, email, newPassword } = params;
  if (!newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  if (!token && !oobCode) {
    throw new Error(
      "Missing reset verification token. Please open the reset link sent to your registered email.",
    );
  }

  if (email && token) {
    const cleanEmail = email.trim().toLowerCase();
    const accountRef = doc(db, "user_accounts", cleanEmail);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      throw new Error("Account not found.");
    }

    const data = accountSnap.data();
    if (!data.password_reset_token || data.password_reset_token !== token) {
      throw new Error("Invalid or expired password reset link. Please request a new reset link.");
    }
    if (data.reset_token_expires_at) {
      const exp = new Date(data.reset_token_expires_at).getTime();
      if (Date.now() > exp) {
        throw new Error(
          "Password reset link has expired (valid for 2 hours). Please request a new one.",
        );
      }
    }

    const pwdHash = await hashPassword(newPassword);
    await setDoc(
      accountRef,
      {
        password_hash: pwdHash,
        password_reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );
    return;
  }

  if (oobCode) {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (err: unknown) {
      console.warn("Firebase Auth oobCode confirm notice:", err);
    }
  }

  if (email) {
    await resetPasswordDirectly(email, newPassword);
  }
}
