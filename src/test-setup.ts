import "@testing-library/jest-dom/vitest";

const originalGetComputedStyle = window.getComputedStyle.bind(window);
Object.defineProperty(window, "getComputedStyle", {
  writable: true,
  value: (element: Element) => originalGetComputedStyle(element),
});

// jsdom 缺少 window.matchMedia，antd 的 useBreakpoint 需要它
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (_query: string) => ({
    matches: false,
    media: _query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom 不支持 URL.createObjectURL，mock 一下
if (typeof URL.createObjectURL === "undefined") {
  Object.defineProperty(URL, "createObjectURL", {
    value: () => "blob:mock-url",
    writable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: () => {},
    writable: true,
  });
}

if (typeof ResizeObserver === "undefined") {
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
}
