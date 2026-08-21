import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NotificationItem } from "@/lib/db";

async function listMyNotifications(userId: string): Promise<NotificationItem[]> {
  try {
    const q = query(collection(db, "notifications"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<NotificationItem, "id">),
    }));
    return items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (err) {
    console.warn("Error loading notifications:", err);
    return [];
  }
}

export function NotificationBell({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const notifications = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => listMyNotifications(userId),
  });

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "notifications"), where("user_id", "==", userId));
    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    });
    return () => unsubscribe();
  }, [queryClient, userId]);

  const items = notifications.data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  async function markAllRead() {
    const unreadItems = items.filter((n) => !n.is_read);
    if (!unreadItems.length) return;
    await Promise.all(
      unreadItems.map((n) => updateDoc(doc(db, "notifications", n.id), { is_read: true })),
    );
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent/60"
        >
          <Bell className={`size-4 ${unread > 0 ? "text-foreground" : "text-muted-foreground"}`} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background shadow-xs">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={`border-b px-4 py-3 last:border-b-0 ${n.is_read ? "" : "bg-accent/40"}`}
            >
              <p className="text-xs font-semibold text-primary">
                {n.assignment_no !== null ? `Assignment ${n.assignment_no}` : "Assignment"}
                {n.assignment_title ? ` · ${n.assignment_title}` : ""}
                {n.question_no !== null ? ` · Question ${n.question_no}` : ""}
              </p>
              <p className="mt-1 text-sm text-foreground">{n.message}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
