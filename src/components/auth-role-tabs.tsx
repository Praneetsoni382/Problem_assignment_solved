import { cn } from "@/lib/utils";

type Role = "student" | "teacher";

interface AuthRoleTabsProps {
  value: Role;
  onChange: (role: Role) => void;
  className?: string;
}

export function AuthRoleTabs({ value, onChange, className }: AuthRoleTabsProps) {
  return (
    <div
      className={cn(
        "flex w-full rounded-full border border-emerald-900/10 bg-emerald-950/10 p-1 backdrop-blur-xs dark:border-emerald-500/20 dark:bg-emerald-950/40",
        className,
      )}
    >
      {(["student", "teacher"] as Role[]).map((role) => {
        const isActive = value === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={cn(
              "flex-1 rounded-full py-2 text-xs font-semibold tracking-wide transition-all",
              isActive
                ? "bg-[#0d5c52] text-white shadow-sm dark:bg-[#116b5f]"
                : "text-[#14423b]/80 hover:text-[#14423b] dark:text-emerald-300/80 dark:hover:text-emerald-100",
            )}
            aria-pressed={isActive}
          >
            {role === "student" ? "I'm a Student" : "I'm a Teacher"}
          </button>
        );
      })}
    </div>
  );
}
