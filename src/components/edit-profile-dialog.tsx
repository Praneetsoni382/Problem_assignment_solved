import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateMyProfile, type Profile } from "@/lib/db";

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(profile.full_name);
  const [enrollmentNo, setEnrollmentNo] = useState(profile.enrollment_no ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (profile.role === "student" && !enrollmentNo.trim())
      return setError("Please enter your enrollment number.");

    setBusy(true);
    try {
      await updateMyProfile({
        fullName,
        ...(profile.role === "student" ? { enrollmentNo } : {}),
      });
      await queryClient.invalidateQueries();
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>
            Your full name is what appears in the teacher&apos;s student list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileName">Full name</Label>
            <Input
              id="profileName"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {profile.role === "student" && (
            <div className="space-y-2">
              <Label htmlFor="profileEnrollment">Enrollment number</Label>
              <Input
                id="profileEnrollment"
                required
                maxLength={40}
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
