// Theme: "system" (follow device), "light" or "dark". Saved on this device.
export const getTheme = () => localStorage.getItem("jt_theme") || "system";

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
  else root.removeAttribute("data-theme");
}

export function setTheme(mode) {
  localStorage.setItem("jt_theme", mode);
  applyTheme(mode);
}
