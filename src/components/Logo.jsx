/** Coffee cup with animated steam. */
export default function Logo({ size = 36 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path className="steam s1" d="M17 5c-2 3 2 4 0 8" />
      <path className="steam s2" d="M24 3c-2 3 2 5 0 9" />
      <path className="steam s3" d="M31 5c-2 3 2 4 0 8" />
      <path d="M9 18h26v11a11 11 0 0 1-11 11h-4A11 11 0 0 1 9 29V18Z" fill="url(#cup)" />
      <path d="M35 21h2.5a4.5 4.5 0 0 1 0 9H34" stroke="url(#cup)" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="22" cy="18" rx="13" ry="2.6" fill="#3b2314" opacity=".55" />
      <defs>
        <linearGradient id="cup" x1="9" y1="18" x2="35" y2="40">
          <stop stopColor="#e9a468" />
          <stop offset="1" stopColor="#9a5a30" />
        </linearGradient>
      </defs>
    </svg>
  )
}
