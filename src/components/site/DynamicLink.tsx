import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Renders an admin-configured link: internal paths use the router, others a plain anchor. */
export function DynamicLink({
  href,
  newTab = false,
  className,
  onClick,
  children,
}: {
  href: string;
  newTab?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const isInternal = href.startsWith("/") && !newTab;
  if (!isInternal) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      to={href as never}
      className={className}
      onClick={onClick}
      activeOptions={{ exact: href === "/" }}
      activeProps={{ className: `${className ?? ""} text-primary` }}
    >
      {children}
    </Link>
  );
}
