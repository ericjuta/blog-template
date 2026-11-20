import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

if (globalThis.ResizeObserver === undefined) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof Element !== "undefined" && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}

afterEach(() => {
  cleanup()
})
