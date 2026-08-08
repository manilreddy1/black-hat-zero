import logo from "@/assets/blackhat-logo.png.asset.json";

export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="BLACK HAT#0 hackathon emblem"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export const logoUrl = logo.url;
