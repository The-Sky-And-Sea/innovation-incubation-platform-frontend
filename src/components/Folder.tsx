import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import "./Folder.css";

interface FolderProps {
  color?: string;
  size?: number;
  items?: ReactNode[];
  className?: string;
  interactive?: boolean;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const num = Number.parseInt(color, 16);
  let red = (num >> 16) & 0xff;
  let green = (num >> 8) & 0xff;
  let blue = num & 0xff;

  red = Math.max(0, Math.min(255, Math.floor(red * (1 - percent))));
  green = Math.max(0, Math.min(255, Math.floor(green * (1 - percent))));
  blue = Math.max(0, Math.min(255, Math.floor(blue * (1 - percent))));

  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1).toUpperCase()}`;
};

export default function Folder({ color = "#14508c", size = 1, items = [], className = "", interactive = true }: FolderProps) {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) papers.push(null);

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
  );

  const handleClick = () => {
    if (!interactive) return;
    setOpen((prev) => !prev);
    if (open) setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
  };

  const handlePaperMouseMove = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (!open) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (event.clientX - centerX) * 0.15;
    const offsetY = (event.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (index: number) => {
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  const style = {
    "--folder-color": color,
    "--folder-back-color": darkenColor(color, 0.12),
    "--paper-1": darkenColor("#ffffff", 0.1),
    "--paper-2": darkenColor("#ffffff", 0.05),
    "--paper-3": "#ffffff",
    "--folder-scale": size,
  } as CSSProperties;

  return (
    <div className={`rb-folder-shell ${className}`.trim()} style={style}>
      <div
        className={`folder ${open ? "open" : ""}`}
        onClick={handleClick}
        onMouseEnter={() => {
          if (!interactive) setOpen(true);
        }}
        onMouseLeave={() => {
          if (!interactive) {
            setOpen(false);
            setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : "img"}
        aria-expanded={interactive ? open : undefined}
        aria-label={interactive ? (open ? "关闭文件夹" : "打开文件夹") : "文件上传"}
      >
        <div className="folder__back">
          {papers.map((item, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={`paper paper-${index + 1}`}
              onMouseMove={(event) => handlePaperMouseMove(event, index)}
              onMouseLeave={() => handlePaperMouseLeave(index)}
              style={
                open
                  ? ({
                      "--magnet-x": `${paperOffsets[index]?.x || 0}px`,
                      "--magnet-y": `${paperOffsets[index]?.y || 0}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {item}
            </div>
          ))}
          <div className="folder__front" />
          <div className="folder__front right" />
        </div>
      </div>
    </div>
  );
}
