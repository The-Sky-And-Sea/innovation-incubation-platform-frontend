import React, { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import "./StaggeredMenu.css";
import BrandLogo from "./BrandLogo";

export interface StaggeredMenuItem {
  ariaLabel: string;
  icon?: ReactNode;
  label: string;
  link: string;
}

export interface LegacyMenuItem {
  icon?: ReactNode;
  key: string;
  label: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  "aria-label"?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  className?: string;
  closeOnClickAway?: boolean;
  closeOnItemClick?: boolean;
  colors?: string[];
  defaultOpen?: boolean;
  displayItemNumbering?: boolean;
  displaySocials?: boolean;
  isFixed?: boolean;
  items?: Array<StaggeredMenuItem | LegacyMenuItem>;
  logoText?: string;
  menuButtonColor?: string;
  mode?: string;
  onItemClick?: (item: StaggeredMenuItem) => void;
  onClick?: (event: { key: string }) => void;
  onMenuClose?: () => void;
  onMenuOpen?: () => void;
  openMenuButtonColor?: string;
  position?: "left" | "right";
  selectedKeys?: string[];
  socialItems?: StaggeredMenuSocialItem[];
}

const makeCssVars = (accentColor?: string) =>
  accentColor ? ({ "--sm-accent": accentColor } as React.CSSProperties) : undefined;

const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  accentColor = "var(--role-primary, #14508c)",
  changeMenuColorOnOpen = true,
  className,
  closeOnClickAway = true,
  closeOnItemClick = true,
  colors = [
    "color-mix(in srgb, var(--role-primary, #14508c) 12%, #ffffff)",
    "color-mix(in srgb, var(--role-primary, #14508c) 46%, #ffffff)",
    "var(--role-primary, #14508c)",
  ],
  defaultOpen = false,
  displayItemNumbering = true,
  displaySocials = false,
  isFixed = false,
  items = [],
  logoText = "菜单",
  menuButtonColor = "var(--role-primary, #14508c)",
  onClick,
  onItemClick,
  onMenuClose,
  onMenuOpen,
  openMenuButtonColor = "#ffffff",
  selectedKeys = [],
  position = "left",
  socialItems = [],
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [textLines, setTextLines] = useState<string[]>(defaultOpen ? ["关闭", "菜单"] : ["菜单", "关闭"]);
  const openRef = useRef(defaultOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const layoutTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  const setLayoutProgress = useCallback((progress: number) => {
    const anchor = toggleBtnRef.current ?? panelRef.current;
    const shell = anchor?.closest(".app-shell") as HTMLElement | null;
    if (!shell) return;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const shellStyles = window.getComputedStyle(shell);
    const panelWidth =
      panelRef.current?.getBoundingClientRect().width ||
      Number.parseFloat(shellStyles.getPropertyValue("--top-menu-panel-width")) ||
      0;
    const contentGap = Number.parseFloat(shellStyles.getPropertyValue("--top-menu-content-gap")) || 0;
    shell.style.setProperty("--top-menu-progress", String(clampedProgress));
    shell.style.setProperty("--top-menu-shift", `${(panelWidth + contentGap) * clampedProgress}px`);
  }, []);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !icon || !textInner) return;

      const preLayers = preContainer
        ? (Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      const initialX = openRef.current ? 0 : offscreen;
      gsap.set([panel, ...preLayers], { xPercent: initialX, opacity: 1 });
      gsap.set(icon, { rotate: openRef.current ? 225 : 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });
      gsap.set(panel.querySelectorAll(".sm-panel-itemLabel"), { yPercent: openRef.current ? 0 : 140, rotate: openRef.current ? 0 : 10 });
      gsap.set(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"), {
        "--sm-num-opacity": openRef.current ? 1 : 0,
      });
      if (toggleBtnRef.current) {
        gsap.set(toggleBtnRef.current, {
          color: changeMenuColorOnOpen && openRef.current ? openMenuButtonColor : menuButtonColor,
        });
      }
      setLayoutProgress(openRef.current ? 1 : 0);
    });
    return () => context.revert();
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor, position, setLayoutProgress]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    layoutTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
    const numberEls = Array.from(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")) as HTMLElement[];
    const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];
    const offscreen = position === "left" ? -100 : 100;

    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    gsap.set(numberEls, { "--sm-num-opacity": 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const timeline = gsap.timeline({ paused: true });
    layers.forEach((layer, index) => {
      timeline.fromTo(layer, { xPercent: offscreen }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, index * 0.07);
    });

    const panelInsertTime = (layers.length ? (layers.length - 1) * 0.07 : 0) + (layers.length ? 0.08 : 0);
    timeline.fromTo(panel, { xPercent: offscreen }, { xPercent: 0, duration: 0.65, ease: "power4.out" }, panelInsertTime);

    const layoutProgress = { value: 0 };
    timeline.fromTo(
      layoutProgress,
      { value: 0 },
      {
        value: 1,
        duration: 0.65,
        ease: "power4.out",
        onUpdate: () => setLayoutProgress(layoutProgress.value),
        onComplete: () => setLayoutProgress(1),
      },
      panelInsertTime,
    );

    timeline.to(
      itemEls,
      {
        yPercent: 0,
        rotate: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: { each: 0.055, from: "start" },
      },
      panelInsertTime + 0.12,
    );
    timeline.to(
      numberEls,
      {
        "--sm-num-opacity": 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: { each: 0.04, from: "start" },
      },
      panelInsertTime + 0.18,
    );

    if (socialTitle) timeline.to(socialTitle, { opacity: 1, duration: 0.45, ease: "power2.out" }, panelInsertTime + 0.28);
    if (socialLinks.length) {
      timeline.to(
        socialLinks,
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: { each: 0.06, from: "start" } },
        panelInsertTime + 0.3,
      );
    }

    openTlRef.current = timeline;
    return timeline;
  }, [position, setLayoutProgress]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const timeline = buildOpenTimeline();
    if (!timeline) {
      busyRef.current = false;
      return;
    }
    timeline.eventCallback("onComplete", () => {
      busyRef.current = false;
    });
    timeline.play(0);
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    const panel = panelRef.current;
    if (!panel) return;
    busyRef.current = true;

    const all = [...preLayerElsRef.current, panel];
    const offscreen = position === "left" ? -100 : 100;
    const shell = toggleBtnRef.current?.closest(".app-shell") as HTMLElement | null;
    const currentProgress = shell
      ? Number.parseFloat(window.getComputedStyle(shell).getPropertyValue("--top-menu-progress"))
      : 1;
    const layoutProgress = { value: Number.isFinite(currentProgress) ? currentProgress : 1 };
    closeTweenRef.current?.kill();
    layoutTweenRef.current?.kill();
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        gsap.set(panel.querySelectorAll(".sm-panel-itemLabel"), { yPercent: 140, rotate: 10 });
        gsap.set(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"), { "--sm-num-opacity": 0 });
        busyRef.current = false;
      },
    });
    layoutTweenRef.current = gsap.to(layoutProgress, {
      value: 0,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onUpdate: () => setLayoutProgress(layoutProgress.value),
      onComplete: () => setLayoutProgress(0),
    });
  }, [position, setLayoutProgress]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    spinTweenRef.current = gsap.to(icon, {
      rotate: opening ? 225 : 0,
      duration: opening ? 0.75 : 0.35,
      ease: opening ? "power4.out" : "power3.inOut",
      overwrite: "auto",
    });
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const button = toggleBtnRef.current;
      if (!button) return;
      colorTweenRef.current?.kill();
      colorTweenRef.current = gsap.to(button, {
        color: changeMenuColorOnOpen && opening ? openMenuButtonColor : menuButtonColor,
        delay: opening ? 0.15 : 0,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor],
  );

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();
    const sequence = opening ? ["菜单", "关闭", "菜单", "关闭"] : ["关闭", "菜单", "关闭", "菜单"];
    setTextLines(sequence);
    gsap.set(inner, { yPercent: 0 });
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -75,
      duration: 0.68,
      ease: "power4.out",
    });
  }, []);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
    animateIcon(false);
    animateColor(false);
    animateText(false);
  }, [animateColor, animateIcon, animateText, onMenuClose, playClose]);

  const toggleMenu = useCallback(() => {
    const next = !openRef.current;
    openRef.current = next;
    setOpen(next);
    if (next) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(next);
    animateColor(next);
    animateText(next);
  }, [animateColor, animateIcon, animateText, onMenuClose, onMenuOpen, playClose, playOpen]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu, closeOnClickAway, open]);

  const handleItemClick = (event: React.MouseEvent, item: StaggeredMenuItem) => {
    event.preventDefault();
    onClick?.({ key: item.link });
    onItemClick?.(item);
    if (closeOnItemClick) closeMenu();
  };

  const normalizedItems: StaggeredMenuItem[] = items.map((item) => {
    if ("link" in item) return item;
    return {
      ariaLabel: item.label,
      icon: item.icon,
      label: item.label,
      link: item.key,
    };
  });

  return (
    <div
      className={`${className ? `${className} ` : ""}staggered-menu-wrapper${isFixed ? " fixed-wrapper" : ""}`}
      data-open={open || undefined}
      data-position={position}
      style={makeCssVars(accentColor)}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {colors.slice(0, 4).map((color, index) => (
          <div key={`${color}-${index}`} className="sm-prelayer" style={{ background: color }} />
        ))}
      </div>
      <header className="staggered-menu-header" aria-label="Main navigation header">
        <div className="sm-logo" aria-label="Logo">
          <span className="sm-logo-mark">
            <BrandLogo />
          </span>
          <span className="sm-logo-text">{logoText}</span>
        </div>
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((line, index) => (
                <span className="sm-toggle-line" key={`${line}-${index}`}>
                  {line}
                </span>
              ))}
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span className="sm-icon-line" />
            <span className="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </header>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
      >
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
            {normalizedItems.map((item) => (
              <li className="sm-panel-itemWrap" key={item.link}>
                <a
                  className={`sm-panel-item ${selectedKeys.includes(item.link) ? "is-active" : ""}`}
                  href={item.link}
                  aria-current={selectedKeys.includes(item.link) ? "page" : undefined}
                  aria-label={item.ariaLabel}
                  onClick={(event) => handleItemClick(event, item)}
                >
                  <span className="sm-panel-itemIcon">{item.icon}</span>
                  <span className="sm-panel-itemLabel">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          {displaySocials && socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Social links">
              <h3 className="sm-socials-title">Links</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((item) => (
                  <li key={item.link} className="sm-socials-item">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
