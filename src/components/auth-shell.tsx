import { type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { AssignEaseLogo } from "./assignease-logo";
import graduateAvatar from "@/assets/images/graduate_avatar_1787078430121.jpg";

export function AuthShell({
  children,
  hideLogo = false,
}: {
  children: ReactNode;
  hideLogo?: boolean;
}) {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#FAF7F2] px-4 py-8 text-[#14423b] antialiased selection:bg-emerald-200 selection:text-emerald-900 dark:bg-[#0c1614] dark:text-emerald-50 sm:py-12">
      {/* Ambient background soft pastel radial blurs matching the reference image */}
      {/* Top Left Peach Glow */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#fed7aa]/50 blur-3xl sm:h-96 sm:w-96 dark:bg-amber-950/20"
        aria-hidden="true"
      />

      {/* Top Right Soft Mint/Cyan Glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#99f6e4]/45 blur-3xl sm:h-96 sm:w-96 dark:bg-teal-950/20"
        aria-hidden="true"
      />

      {/* Bottom Left Soft Emerald Glow */}
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#a7f3d0]/40 blur-3xl sm:h-96 sm:w-96 dark:bg-emerald-950/20"
        aria-hidden="true"
      />

      {/* Bottom Right Soft Lilac/Purple Glow */}
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#ddd6fe]/50 blur-3xl sm:h-96 sm:w-96 dark:bg-purple-950/20"
        aria-hidden="true"
      />

      {/* Ambient 4-point Sparkle at bottom right matching reference image */}
      <div
        className="pointer-events-none absolute bottom-8 right-8 text-[#c4b5fd]/80 dark:text-purple-400/40"
        aria-hidden="true"
      >
        <Sparkles className="size-6" />
      </div>

      {/* Main Centered Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-[380px] flex-col items-center sm:max-w-[400px]">
        {/* Top Logo */}
        {!hideLogo && (
          <div className="mb-6 sm:mb-8">
            <AssignEaseLogo size="md" />
          </div>
        )}

        {/* Children Form / Content */}
        {children}
      </div>
    </main>
  );
}

export function AuthHero({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto mb-6 flex flex-col items-center justify-center ${className}`}>
      {/* 3D Student Graduate Avatar */}
      <div className="relative flex size-32 items-center justify-center sm:size-36">
        <img
          src={graduateAvatar}
          alt="Student Graduate Avatar"
          className="size-full rounded-full object-cover drop-shadow-md transition-transform duration-300 hover:scale-105"
          loading="eager"
        />
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`w-full ${className}`}>{children}</div>;
}
