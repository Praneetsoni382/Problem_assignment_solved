import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage } from "./firebase";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "teacher" | "student";
  enrollment_no: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  teacher_id: string;
  assignment_no: number;
  title: string;
  total_questions: number;
  question_paper_url: string | null;
  is_open: boolean;
  closed_at: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: "draft" | "submitted" | "checked";
  submitted_at: string | null;
  total_marks: number | null;
  checked_status: "pending" | "checked" | "partially_checked" | "unchecked";
  checked_at: string | null;
  created_at: string;
  student?: {
    full_name: string;
    enrollment_no: string | null;
  };
}

export interface SubmissionPage {
  id: string;
  submission_id: string;
  question_no: number;
  page_order: number;
  image_url: string;
  uploaded_at: string;
}

export interface QuestionMark {
  id: string;
  submission_id: string;
  question_no: number;
  marks_awarded: number | null;
  feedback: string | null;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  assignment_title: string | null;
  assignment_no: number | null;
  question_no: number | null;
  submission_id: string | null;
  created_at: string;
}

import { getLocalSession, setLocalSession } from "./auth-service";

/**
 * Get the current user profile from Firestore or local session
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const local = getLocalSession();
  const user = auth.currentUser;
  const targetUid = user?.uid || local?.id;

  if (!targetUid) return null;

  try {
    const docRef = doc(db, "profiles", targetUid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const p = { id: docSnap.id, ...(docSnap.data() as Omit<Profile, "id">) };
      setLocalSession(p);
      return p;
    }
  } catch (err) {
    console.warn("Error fetching current profile:", err);
  }

  return local || null;
}

/**
 * Ensure profile exists after sign up / login
 */
export async function ensureProfile(): Promise<Profile | "needs-details" | null> {
  const existing = await getCurrentProfile();
  if (existing) return existing;

  const user = auth.currentUser;
  if (!user) return null;

  const displayName = user.displayName?.trim() || "";
  // Check if we can infer or if we need details
  if (!displayName || displayName.length < 2) {
    return "needs-details";
  }

  return createMyProfile({
    role: "student",
    fullName: displayName,
    enrollmentNo: null,
  });
}

/**
 * Create a new profile document in Firestore
 */
export async function createMyProfile(input: {
  role: "student" | "teacher";
  fullName: string;
  enrollmentNo: string | null;
}): Promise<Profile> {
  const user = auth.currentUser;
  if (!user) throw new Error("You are not signed in.");

  const profileData: Profile = {
    id: user.uid,
    role: input.role,
    full_name: input.fullName.trim(),
    email: user.email ?? "",
    enrollment_no: input.role === "student" ? (input.enrollmentNo?.trim() ?? null) : null,
    created_at: new Date().toISOString(),
  };

  await setDoc(doc(db, "profiles", user.uid), profileData);
  return profileData;
}

/**
 * Update an existing profile
 */
export async function updateMyProfile(input: {
  fullName: string;
  enrollmentNo?: string | null;
}): Promise<Profile> {
  const user = auth.currentUser;
  if (!user) throw new Error("You are not signed in.");

  const docRef = doc(db, "profiles", user.uid);
  const updates: Record<string, unknown> = {
    full_name: input.fullName.trim(),
  };
  if (input.enrollmentNo !== undefined) {
    updates["enrollment_no"] = input.enrollmentNo?.trim() || null;
  }

  await updateDoc(docRef, updates);
  const updatedDoc = await getDoc(docRef);
  return { id: updatedDoc.id, ...(updatedDoc.data() as Omit<Profile, "id">) };
}

/**
 * List all assignments
 */
export async function listAssignments(): Promise<Assignment[]> {
  try {
    const q = query(collection(db, "assignments"), orderBy("assignment_no", "asc"));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assignment, "id">) }));

    // Purge any legacy calculus assignment from Firestore if found
    for (const docItem of snap.docs) {
      const data = docItem.data();
      if (
        data.title &&
        typeof data.title === "string" &&
        data.title.toLowerCase().includes("calculus")
      ) {
        void deleteAssignment(docItem.id);
      }
    }

    return list.filter((a) => !a.title || !a.title.toLowerCase().includes("calculus"));
  } catch {
    // Fallback without ordering if index is still building
    const snap = await getDocs(collection(db, "assignments"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assignment, "id">) }));

    for (const docItem of snap.docs) {
      const data = docItem.data();
      if (
        data.title &&
        typeof data.title === "string" &&
        data.title.toLowerCase().includes("calculus")
      ) {
        void deleteAssignment(docItem.id);
      }
    }

    return list
      .filter((a) => !a.title || !a.title.toLowerCase().includes("calculus"))
      .sort((a, b) => (a.assignment_no || 0) - (b.assignment_no || 0));
  }
}

/**
 * Get single assignment by ID
 */
export async function getAssignment(id: string): Promise<Assignment | null> {
  if (!id) return null;
  const docRef = doc(db, "assignments", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Assignment, "id">) };
}

/**
 * Create a new assignment
 */
export async function createAssignment(data: {
  teacher_id: string;
  assignment_no: number;
  title: string;
  total_questions: number;
  question_paper_url?: string | null;
  is_open?: boolean;
}): Promise<Assignment> {
  const docRef = doc(collection(db, "assignments"));
  const newAssignment: Assignment = {
    id: docRef.id,
    teacher_id: data.teacher_id,
    assignment_no: data.assignment_no,
    title: data.title.trim(),
    total_questions: data.total_questions || 1,
    question_paper_url: data.question_paper_url || null,
    is_open: data.is_open ?? true,
    closed_at: null,
    created_at: new Date().toISOString(),
  };
  await setDoc(docRef, newAssignment);
  return newAssignment;
}

/**
 * List all students
 */
export async function listStudents(): Promise<Profile[]> {
  try {
    const q = query(collection(db, "profiles"), where("role", "==", "student"));
    const snap = await getDocs(q);
    const students = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Profile, "id">) }));
    return students.sort((a, b) => (a.enrollment_no || "").localeCompare(b.enrollment_no || ""));
  } catch (err) {
    console.warn("Error listing students:", err);
    return [];
  }
}

/**
 * List submissions, optionally filtered by assignmentId
 */
export async function listSubmissions(assignmentId?: string): Promise<Submission[]> {
  try {
    let snap;
    if (assignmentId) {
      const q = query(collection(db, "submissions"), where("assignment_id", "==", assignmentId));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(collection(db, "submissions"));
    }

    const submissions = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Submission, "id">),
    }));

    // Enrich with student profile if available
    const profiles = await listStudents();
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return submissions.map((s) => {
      const student = profileMap.get(s.student_id);
      return {
        ...s,
        student: student
          ? { full_name: student.full_name, enrollment_no: student.enrollment_no }
          : s.student,
      };
    });
  } catch (err) {
    console.warn("Error listing submissions:", err);
    return [];
  }
}

/**
 * Get or create submission for student & assignment
 */
export async function getOrCreateSubmission(
  assignmentId: string,
  studentId: string,
): Promise<Submission> {
  const q = query(
    collection(db, "submissions"),
    where("assignment_id", "==", assignmentId),
    where("student_id", "==", studentId),
    limit(1),
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<Submission, "id">) };
  }

  // Create new submission
  const docRef = doc(collection(db, "submissions"));
  const newSub: Submission = {
    id: docRef.id,
    assignment_id: assignmentId,
    student_id: studentId,
    status: "draft",
    submitted_at: null,
    total_marks: null,
    checked_status: "pending",
    checked_at: null,
    created_at: new Date().toISOString(),
  };

  await setDoc(docRef, newSub);
  return newSub;
}

/**
 * List pages for a submission
 */
export async function listPages(submissionId: string): Promise<SubmissionPage[]> {
  try {
    const q = query(collection(db, "submission_pages"), where("submission_id", "==", submissionId));
    const snap = await getDocs(q);
    const pages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SubmissionPage, "id">) }));
    return pages.sort((a, b) => {
      if (a.question_no !== b.question_no) return a.question_no - b.question_no;
      return (a.page_order || 0) - (b.page_order || 0);
    });
  } catch (err) {
    console.warn("Error listing submission pages:", err);
    return [];
  }
}

/**
 * Delete a submission page
 */
export async function deletePage(pageId: string): Promise<void> {
  await deleteDoc(doc(db, "submission_pages", pageId));
}

/**
 * Helper to compress large image files quickly on client before saving/uploading
 */
async function compressImageIfNeeded(
  file: Blob | File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<Blob | File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }
  // If already small (< 350KB), return as is
  if (file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Upload a file/blob to Firebase Storage with a fast 1.5-second race timeout & immediate base64 fallback
 */
export async function uploadFileToStorage(
  bucketPath: string,
  blobOrFile: Blob | File,
): Promise<string> {
  const processedFile = await compressImageIfNeeded(blobOrFile);

  try {
    const storageRef = ref(storage, bucketPath);
    // Strict 1.5s timeout race against Firebase Storage hanging/retries
    const uploadPromise = uploadBytes(storageRef, processedFile).then(() =>
      getDownloadURL(storageRef),
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Storage timeout - fast fallback")), 1500),
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (storageErr) {
    console.info(
      "Using instant local Data URL fallback for document:",
      (storageErr as Error)?.message || storageErr,
    );
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(processedFile);
    });
  }
}

/**
 * Get signed or public URL for assets
 */
export async function signedUrl(
  _bucket: "submission-scans" | "question-papers",
  path: string,
  _expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const cleanPath = path.startsWith("data:")
    ? path.replace(/[?&]mpq=\d+$/, "")
    : path.split("?")[0];
  // If already HTTP / HTTPS or data URL, return as is
  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("data:")
  ) {
    return cleanPath;
  }
  try {
    const storageRef = ref(storage, cleanPath);
    return await getDownloadURL(storageRef);
  } catch {
    return cleanPath;
  }
}

/**
 * Seed initial sample assignments and a demo submission if Firestore has no assignments (Disabled)
 */
export async function seedDemoAssignmentsIfEmpty(_teacherId: string): Promise<void> {
  return;
}

/**
 * Permanently delete an assignment and all associated submissions, pages, question marks, and notifications
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  if (!assignmentId) return;

  // 1. Delete assignment doc
  await deleteDoc(doc(db, "assignments", assignmentId));

  // 2. Delete all related submissions
  try {
    const qSubs = query(collection(db, "submissions"), where("assignment_id", "==", assignmentId));
    const subsSnap = await getDocs(qSubs);

    for (const subDoc of subsSnap.docs) {
      const subId = subDoc.id;

      // Delete submission pages
      const qPages = query(collection(db, "submission_pages"), where("submission_id", "==", subId));
      const pagesSnap = await getDocs(qPages);
      for (const pageDoc of pagesSnap.docs) {
        await deleteDoc(doc(db, "submission_pages", pageDoc.id));
      }

      // Delete question marks
      const qMarks = query(collection(db, "question_marks"), where("submission_id", "==", subId));
      const marksSnap = await getDocs(qMarks);
      for (const markDoc of marksSnap.docs) {
        await deleteDoc(doc(db, "question_marks", markDoc.id));
      }

      // Delete submission doc
      await deleteDoc(doc(db, "submissions", subId));
    }
  } catch (err) {
    console.warn("Error deleting assignment submissions:", err);
  }

  // 3. Delete related notifications
  try {
    const notifsSnap = await getDocs(collection(db, "notifications"));
    for (const nDoc of notifsSnap.docs) {
      const data = nDoc.data();
      if (data.assignment_id === assignmentId) {
        await deleteDoc(doc(db, "notifications", nDoc.id));
      }
    }
  } catch (err) {
    console.warn("Error deleting assignment notifications:", err);
  }
}

/**
 * Permanently delete a student profile and all their submissions, pages, question marks, and notifications
 */
export async function deleteStudent(studentId: string): Promise<void> {
  if (!studentId) return;

  // 1. Delete profile doc
  await deleteDoc(doc(db, "profiles", studentId));

  // 2. Delete all student submissions
  try {
    const qSubs = query(collection(db, "submissions"), where("student_id", "==", studentId));
    const subsSnap = await getDocs(qSubs);

    for (const subDoc of subsSnap.docs) {
      const subId = subDoc.id;

      // Delete submission pages
      const qPages = query(collection(db, "submission_pages"), where("submission_id", "==", subId));
      const pagesSnap = await getDocs(qPages);
      for (const pageDoc of pagesSnap.docs) {
        await deleteDoc(doc(db, "submission_pages", pageDoc.id));
      }

      // Delete question marks
      const qMarks = query(collection(db, "question_marks"), where("submission_id", "==", subId));
      const marksSnap = await getDocs(qMarks);
      for (const markDoc of marksSnap.docs) {
        await deleteDoc(doc(db, "question_marks", markDoc.id));
      }

      // Delete submission doc
      await deleteDoc(doc(db, "submissions", subId));
    }
  } catch (err) {
    console.warn("Error deleting student submissions:", err);
  }

  // 3. Delete student notifications
  try {
    const qNotifs = query(collection(db, "notifications"), where("user_id", "==", studentId));
    const notifsSnap = await getDocs(qNotifs);
    for (const nDoc of notifsSnap.docs) {
      await deleteDoc(doc(db, "notifications", nDoc.id));
    }
  } catch (err) {
    console.warn("Error deleting student notifications:", err);
  }
}
