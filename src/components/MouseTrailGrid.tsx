import { useMemo } from "react";
import "./MouseTrailGrid.css";

function randomColor(index: number): string {
  const r = ((index * 73 + 17) % 256);
  const g = ((index * 137 + 89) % 256);
  const b = ((index * 211 + 43) % 256);
  return `rgba(${r}, ${g}, ${b}, 0.8)`;
}

export default function MouseTrailGrid() {
  const boxes = useMemo(() => {
    const count = 500;
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      color: randomColor(i),
    }));
  }, []);

  return (
    <div className="mouse-trail-grid" aria-hidden="true">
      {boxes.map((box) => (
        <div
          key={box.key}
          className="mouse-trail-box"
          style={{ "--hover-color": box.color } as React.CSSProperties}
        />
      ))}
    </div>
  );
}