import { useEffect } from "react";

const STYLE = `
.mouse-trail-root { position:fixed; inset:0; z-index:10; pointer-events:none; overflow:hidden }
.mouse-trail-root i {
  position:absolute; width:24px; height:24px; border-radius:50%;
  pointer-events:none; transform:translate(-50%,-50%) scale(0);
  background:hsl(var(--h,0),70%,60%); opacity:0;
  transition:transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease-out;
  will-change:transform,left,top;
}
.mouse-trail-root i.show { transform:translate(-50%,-50%) scale(1.8); opacity:0.9 }
`;

let styleInjected = false;

export default function MouseTrailGrid() {
  useEffect(() => {
    if (!styleInjected) {
      const s = document.createElement("style");
      s.textContent = STYLE;
      document.head.appendChild(s);
      styleInjected = true;
    }

    const root = document.createElement("div");
    root.className = "mouse-trail-root";
    root.setAttribute("aria-hidden", "true");

    const dot = document.createElement("i");
    root.appendChild(dot);
    document.body.appendChild(root);

    let timer = 0;
    let hue = 0;

    const move = (e: MouseEvent) => {
      hue = (hue + 7) % 360;
      dot.style.setProperty("--h", String(hue));
      dot.style.left = e.clientX + "px";
      dot.style.top = e.clientY + "px";
      dot.classList.add("show");

      clearTimeout(timer);
      timer = window.setTimeout(() => {
        dot.classList.remove("show");
      }, 120);
    };

    let leaveTimer = 0;
    const leave = () => {
      clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => {
        dot.classList.remove("show");
      }, 200);
    };

    document.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  return null;
}