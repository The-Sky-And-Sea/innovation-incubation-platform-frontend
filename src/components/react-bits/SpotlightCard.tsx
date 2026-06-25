import { type CSSProperties, type PropsWithChildren, useRef } from "react";

interface SpotlightCardProps extends PropsWithChildren {
  className?: string;
  spotlightColor?: string;
  style?: CSSProperties;
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(200, 145, 58, 0.18)",
  style,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    divRef.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    divRef.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    divRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div
      ref={divRef}
      className={`rb-spotlight-card ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}
