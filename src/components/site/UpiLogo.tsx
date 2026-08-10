/** Simple UPI mark used as the centre badge of payment QR codes. */
export function UpiLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} role="img" aria-label="UPI">
      <rect width="120" height="60" rx="8" fill="#ffffff" />
      <polygon points="72,8 88,8 74,52 58,52" fill="#097939" />
      <polygon points="88,8 104,8 90,52 74,52" fill="#ed752e" />
      <text
        x="10"
        y="42"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="30"
        fontWeight="700"
        fill="#0f0f0f"
      >
        UPI
      </text>
    </svg>
  );
}
