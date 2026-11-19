const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const getToken = () => localStorage.getItem("jt_token");
export const setToken = (t) => localStorage.setItem("jt_token", t);
export const clearToken = () => localStorage.removeItem("jt_token");

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error("Cannot reach the server. If it was asleep, wait a minute and try again.");
  }

  let data = {};
  try {
    data = await res.json();
  } catch (e) {}

  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
