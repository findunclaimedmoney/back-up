const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function siteHref(path: string) {
  if (path === "/") return basePath || "/";
  return `${basePath}${path}`;
}
