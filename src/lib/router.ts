import { useCallback, useEffect, useState } from "react"
import { BLOG_POSTS } from '../data/blog-data';
import type { PostSlug } from '../data/blog-data';

export const SITE_ORIGIN = "https://askgina-blog.pages.dev"

export type AppRoute =
  | { kind: "post"; slug: PostSlug }
  | { kind: "index" }
  | { kind: "design-system" }
  | { kind: "not-found"; pathname: string }

export type RouteMeta = {
  title: string
  description: string
  canonicalPath: string
}

export function isPostSlug(value: string): value is PostSlug {
  return BLOG_POSTS.some((post) => post.slug === value)
}

export function parseRoute(pathname: string, hash = ""): AppRoute {
  const path = pathname.replace(/\/+$/, "") || "/"
  if (path === "/design-system" || hash === "#design-system") {
    return { kind: "design-system" }
  }
  if (path === "/research") {return { kind: "index" }}
  if (path.startsWith("/posts/")) {
    const slug = path.slice("/posts/".length)
    if (isPostSlug(slug)) {return { kind: "post", slug }}
  }
  if (path === "/") {return { kind: "post", slug: "evidence-first-ui" }}
  return { kind: "not-found", pathname: path }
}

export function routeToPath(route: AppRoute): string {
  switch (route.kind) {
    case "index":
      return "/research"
    case "design-system":
      return "/design-system"
    case "post":
      return `/posts/${route.slug}`
    case "not-found":
      return route.pathname
  }
}

export function routesEqual(a: AppRoute, b: AppRoute): boolean {
  if (a.kind === "post") {return b.kind === "post" && a.slug === b.slug}
  if (a.kind === "not-found") {
    return b.kind === "not-found" && a.pathname === b.pathname
  }
  return a.kind === b.kind
}

export function getRouteMeta(route: AppRoute): RouteMeta {
  const canonicalPath = routeToPath(route)

  switch (route.kind) {
    case "not-found":
      return {
        title: "404: Page Not Found | REA Research",
        description: "The requested page could not be found on REA Research.",
        canonicalPath: "/404",
      }
    case "index":
      return {
        title: "All Research | REA Research",
        description:
          "Interactive technical reports combining Reverse Engineer Anything (REA) evidence provenance with Vercel UI SDK headless primitives and live agent bridges.",
        canonicalPath,
      }
    case "design-system":
      return {
        title: "Design System | REA Research",
        description:
          "An interactive Vercel UI SDK component gallery showcasing accessible states for REA Research interfaces.",
        canonicalPath,
      }
    case "post": {
      const post = BLOG_POSTS.find((entry) => entry.slug === route.slug)
      if (!post) {throw new Error(`Missing blog post: ${route.slug}`)}
      return {
        title: `${post.title} | REA Research`,
        description: post.subtitle,
        canonicalPath,
      }
    }
  }
}

export function applyRouteMeta(route: AppRoute): void {
  if (typeof document === "undefined") {return}

  const { title, description, canonicalPath } = getRouteMeta(route)
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`
  document.title = title

  const metaTags = [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[property="og:url"]', canonicalUrl],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
  ] as const

  for (const [selector, content] of metaTags) {
    document.querySelector(selector)?.setAttribute("content", content)
  }
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl)
}

function readCurrentRoute(): AppRoute {
  return typeof window !== "undefined"
    ? parseRoute(window.location.pathname, window.location.hash)
    : { kind: "post", slug: "evidence-first-ui" }
}

function scrollToTop(browser: Window): void {
  // jsdom exposes scrollTo as an unimplemented stub.
  if (typeof browser.scrollTo !== "function" || /jsdom/i.test(browser.navigator.userAgent)) {
    return
  }
  const reduceMotion = browser.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  browser.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "instant" : "smooth" })
}

export type UseAppRouteResult = {
  route: AppRoute
  navigate: (next: AppRoute, options?: { replace?: boolean }) => void
}

export function useAppRoute(initialRoute?: AppRoute): UseAppRouteResult {
  const [route, setRoute] = useState<AppRoute>(() => initialRoute ?? readCurrentRoute())

  useEffect(() => {
    if (typeof window === "undefined") {return}
    const browser = window
    const syncRoute = () => {
      const next = readCurrentRoute()
      setRoute((current) => (routesEqual(current, next) ? current : next))
    }

    browser.addEventListener("popstate", syncRoute)
    browser.addEventListener("hashchange", syncRoute)
    syncRoute()
    return () => {
      browser.removeEventListener("popstate", syncRoute)
      browser.removeEventListener("hashchange", syncRoute)
    }
  }, [])

  useEffect(() => {
    applyRouteMeta(route)
  }, [route])

  const navigate = useCallback((next: AppRoute, options?: { replace?: boolean }) => {
    const targetPath = routeToPath(next)
    if (typeof window !== "undefined") {
      const { location, history } = window
      if (location.pathname !== targetPath || location.hash) {
        if (options?.replace) {
          history.replaceState(null, "", targetPath)
        } else {
          history.pushState(null, "", targetPath)
        }
      }
    }

    setRoute((current) => (routesEqual(current, next) ? current : next))
    if (typeof window !== "undefined") {scrollToTop(window)}
  }, [])

  return { route, navigate }
}
