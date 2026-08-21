import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  pillVariant?: boolean;
}

export function PasswordInput({ className, pillVariant = true, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  if (pillVariant) {
    return (
      <div className="relative w-full">
        <input
          type={show ? "text" : "password"}
          className={cn(
            "h-12 w-full rounded-full bg-[#13463F] px-6 pr-12 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:ring-2 focus:ring-emerald-400/60 focus:bg-[#0f3d37] dark:bg-[#113e38] dark:placeholder:text-emerald-200/50",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200/70 transition-colors hover:text-white focus:outline-hidden"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-hidden"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
