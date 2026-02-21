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
        className={cn(sizeClasses[size], "shrink-0")}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 750 750"
      >
        <defs>
          <clipPath id="logo-a"><path d="M0 0h750v747.406H0z"/></clipPath>
          <clipPath id="logo-b"><path d="M60 0h630c33.137 0 60 26.863 60 60v627.406c0 33.137-26.863 60-60 60H60c-33.137 0-60-26.863-60-60V60C0 26.863 26.863 0 60 0z"/></clipPath>
          <clipPath id="logo-c"><path d="M0 0h750v748H0z"/></clipPath>
          <clipPath id="logo-d"><path d="M213.547 389H529v286H213.547z"/></clipPath>
        </defs>
        <g clipPath="url(#logo-a)">
          <g clipPath="url(#logo-b)">
            <g clipPath="url(#logo-c)">
              <path d="M0 0h750.324v747.406H0z" fill="#000"/>
            </g>
          </g>
        </g>
        <path fill="#fff" fillRule="evenodd" d="M253.777 269.145c-44.336-44.368-44.336-116.364 0-160.696 44.34-44.367 116.356-44.367 160.696 0L535.02 228.957v160.695l-160.696.024z"/>
        <g clipPath="url(#logo-d)">
          <path fill="#fff" fillRule="evenodd" d="M334.117 670.934 213.574 550.402l.028-160.672 160.671-.023 120.54 120.535c44.335 44.344 44.335 116.363 0 160.695-44.34 44.368-116.36 44.368-160.696 0z"/>
        </g>
      </svg>
      {showName && (
        <span
          className={cn(
            "font-medium tracking-tight text-foreground",
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
