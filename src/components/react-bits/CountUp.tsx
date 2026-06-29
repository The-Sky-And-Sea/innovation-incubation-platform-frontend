import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  separator?: string;
  className?: string;
}

function formatNumber(value: number, separator: string) {
  const rounded = Math.round(value);
  if (!separator) return String(rounded);
  return new Intl.NumberFormat("zh-CN").format(rounded).replace(/,/g, separator);
}

export default function CountUp({
  to,
  from = 0,
  duration = 900,
  delay = 0,
  separator = ",",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setValue(to);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setValue(to);
      return;
    }

    let frame = 0;
    let startTime = 0;
    let timeout = 0;
    const run = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(from + (to - from) * eased);
      if (progress < 1) frame = window.requestAnimationFrame(run);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        timeout = window.setTimeout(() => {
          frame = window.requestAnimationFrame(run);
        }, delay);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [delay, duration, from, to]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(value, separator)}
    </span>
  );
}
