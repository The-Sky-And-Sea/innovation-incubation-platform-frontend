interface BrandLogoProps {
  className?: string;
  variant?: "mark" | "full";
}

const LOGO_SRC = {
  mark: "/brand/incubation-platform-logo-mark.png",
  full: "/brand/incubation-platform-logo-full.png",
};

export default function BrandLogo({ className = "", variant = "mark" }: BrandLogoProps) {
  return (
    <img
      className={`brand-logo brand-logo-${variant}${className ? ` ${className}` : ""}`}
      src={LOGO_SRC[variant]}
      alt="孵化平台"
      draggable={false}
    />
  );
}
