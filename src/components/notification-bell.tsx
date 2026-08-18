import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Tables } from "@/integrations/supabase/types";

type Notification = Tables<"notifications">;

async function listMyNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export function NotificationBell({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const notifications = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => listMyNotifications(userId),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const items = notifications.data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  async function markAllRead() {
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
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
          <Bell className="size-4 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
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
