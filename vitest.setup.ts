import "@testing-library/jest-dom";

// Mock ResizeObserver for D3 components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
