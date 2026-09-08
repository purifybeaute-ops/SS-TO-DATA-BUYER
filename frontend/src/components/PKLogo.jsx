/**
 * PK Monogram Batik logo — the official PelangganKu mark.
 * Terracotta rounded square with subtle inner border and "PK" wordmark.
 */
export default function PKLogo({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PelangganKu"
    >
      <defs>
        <linearGradient id="pk-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#pk-bg)" />
      <rect
        x="4" y="4" width="56" height="56" rx="11"
        fill="none" stroke="#7C2D12" strokeWidth="1.2" opacity="0.55"
      />
      <text
        x="32" y="43"
        fontFamily="'Sora','Plus Jakarta Sans',Arial,sans-serif"
        fontSize="28" fontWeight="800"
        fill="#FFF7ED" textAnchor="middle"
        letterSpacing="-1"
      >PK</text>
    </svg>
  );
}
