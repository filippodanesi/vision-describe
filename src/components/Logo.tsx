import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

export function Logo({ className, size = "md", showName = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <svg
        className={cn(sizeClasses[size], "text-foreground shrink-0")}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 403.5 750"
        fill="currentColor"
        role="img"
        aria-label={showName ? undefined : 'VisionDescribe'}
        aria-hidden={showName ? true : undefined}
      >
        <defs>
          <clipPath id="logo-a"><path d="M8 .59h394V394H8z"/></clipPath>
          <clipPath id="logo-b"><path d="M0 393h393v356.535H0z"/></clipPath>
        </defs>
        <g clipPath="url(#logo-a)">
          <path fillRule="evenodd" d="M50.21 242.969c-55.335-55.39-55.335-145.274 0-200.621 55.34-55.391 145.224-55.391 200.56 0l150.453 150.449v200.621l-200.559.031z"/>
        </g>
        <g clipPath="url(#logo-b)">
          <path fillRule="evenodd" d="M150.48 744.59.035 594.11l.031-200.59 200.536-.032 150.437 150.485c55.336 55.359 55.336 145.273 0 200.625-55.336 55.39-145.223 55.39-200.559 0z"/>
        </g>
      </svg>
      {showName && (
        <span
          className={cn(
            "ml-2 font-semibold tracking-tightest text-foreground",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-2xl",
          )}
        >
          VisionDescribe
        </span>
      )}
    </div>
  );
}
