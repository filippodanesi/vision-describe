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
        viewBox="0 0 157 157"
        fillRule="evenodd"
        strokeLinejoin="round"
        strokeMiterlimit="2"
        clipRule="evenodd"
        fill="currentColor"
      >
        <path d="M9.594 46.257c-10.573-10.58-10.573-27.748 0-38.32 10.573-10.58 27.747-10.58 38.32 0L76.66 36.674v38.32l-38.32.006L9.594 46.257Z" />
        <path d="M28.752 142.07.007 113.327l.006-38.314 38.315-.006 28.744 28.744c10.573 10.574 10.573 27.748 0 38.32-10.573 10.58-27.747 10.58-38.32 0Z" />
      </svg>
      {showName && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
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
