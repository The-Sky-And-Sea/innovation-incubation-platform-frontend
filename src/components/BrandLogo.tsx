interface BrandLogoProps {
  className?: string;
  variant?: "mark" | "full" | "text";
  tone?: "default" | "night";
}

const LOGO_SRC = {
  default: {
    mark: "/brand/incubation-platform-logo-mark.png",
    full: "/brand/incubation-platform-logo-full.png",
    text: "/brand/incubation-platform-logo-text.png",
  },
  night: {
    mark: "/brand/incubation-platform-logo-mark-night.png",
    full: "/brand/incubation-platform-logo-full-night.png",
    text: "/brand/incubation-platform-logo-text-night.png",
  },
};

export default function BrandLogo({ className = "", variant = "mark", tone = "default" }: BrandLogoProps) {
  return (
    <img
      className={`brand-logo brand-logo-${variant}${className ? ` ${className}` : ""}`}
      src={LOGO_SRC[tone][variant]}
      alt="孵化平台"
      draggable={false}
    />
  );
}
