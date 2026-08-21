export function AssignEaseLogo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const textSize = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Stylized Ribbon 'A' icon matching the reference image */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
        aria-hidden="true"
      >
        {/* Soft peachy/coral ribbon loop accent on right/bottom */}
        <path
          d="M26 24C29.5 28.5 33.5 35 34 38.5C34.5 42 32 44 28.5 44C25.5 44 23 41.5 22 38"
          stroke="#E6A694"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dark pine / emerald green dynamic loop forming the 'A' */}
        <path
          d="M17 38C15 34 14 27 19 16C23 7 30 6 32 10C34 14 31 22 22 28C16 32 11 37 13 41C14.5 44 19 44 25 39"
          stroke="#0D5C52"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display ${textSize} font-bold tracking-tight text-[#16332E] dark:text-emerald-100`}
      >
        AssignEase
      </span>
    </div>
  );
}
