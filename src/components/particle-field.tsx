const PARTICLES = [
  { left: "6%", top: "12%", size: 90, delay: "0s", color: "oklch(0.55 0.09 258 / 0.16)" },
  { left: "22%", top: "68%", size: 54, delay: "-3s", color: "oklch(0.75 0.13 75 / 0.18)" },
  { left: "44%", top: "24%", size: 34, delay: "-6s", color: "oklch(0.55 0.09 258 / 0.14)" },
  { left: "63%", top: "78%", size: 120, delay: "-9s", color: "oklch(0.75 0.13 75 / 0.12)" },
  { left: "82%", top: "18%", size: 68, delay: "-4.5s", color: "oklch(0.55 0.09 258 / 0.18)" },
  { left: "92%", top: "62%", size: 40, delay: "-7.5s", color: "oklch(0.75 0.13 75 / 0.2)" },
  { left: "34%", top: "92%", size: 26, delay: "-12s", color: "oklch(0.55 0.09 258 / 0.2)" },
  { left: "72%", top: "42%", size: 22, delay: "-15s", color: "oklch(0.75 0.13 75 / 0.22)" },
];

/** Decorative animated 3D-ish particle layer behind app content. */
export function ParticleField() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: `${14 + (i % 5) * 3}s`,
            background: `radial-gradient(circle at 32% 28%, ${p.color}, transparent 70%)`,
            boxShadow: `inset 0 0 ${p.size / 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
