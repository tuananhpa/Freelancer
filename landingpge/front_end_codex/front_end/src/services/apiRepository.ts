import type { Repository, AdminUser } from "../types/domain";
import { normalizeSettings, validateContactSettings } from "./contacts";
import { normalizeInquiry } from "./inquiries";
export const apiBase = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      data?.message ||
        `Yêu cầu thất bại (${response.status}). Vui lòng thử lại.`,
      response.status,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const apiRepository: Repository = {
  products: {
    list: (admin = false) => request(admin ? "/admin/products" : "/products"),
    get: async (slug) => {
      try {
        return await request(`/products/${encodeURIComponent(slug)}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return undefined;
        throw e;
      }
    },
    save: (p) =>
      request(`/admin/products/${encodeURIComponent(p.id)}`, "PUT", p),
    remove: (id) =>
      request(`/admin/products/${encodeURIComponent(id)}`, "DELETE"),
  },
  reviews: {
    list: (id) =>
      request(
        id ? `/products/${encodeURIComponent(id)}/reviews` : "/admin/reviews",
      ),
    add: (r) =>
      request(
        `/products/${encodeURIComponent(r.productId)}/reviews`,
        "POST",
        r,
      ),
  },
  inquiries: {
    list: () => request("/admin/inquiries"),
    add: async (i) => request("/inquiries", "POST", normalizeInquiry(i)),
    update: (id, status) =>
      request(`/admin/inquiries/${encodeURIComponent(id)}`, "PATCH", {
        status,
      }),
  },
  messages: {
    list: () => request("/admin/messages"),
    add: (m) => request("/messages", "POST", m),
    reply: (id, reply) =>
      request(`/admin/messages/${encodeURIComponent(id)}/reply`, "POST", {
        reply,
      }),
  },
  settings: {
    get: async () => normalizeSettings(await request("/settings")),
    save: (s) => {
      validateContactSettings(s);
      return request("/admin/settings", "PUT", {
        ...s,
        zaloUrl:
          s.socialLinks.find((x) => x.platform === "zalo" && x.enabled)?.url ??
          "",
      });
    },
  },
};
export const apiAuth = {
  me: () => request<AdminUser>("/auth/me"),
  login: (email: string, password: string) =>
    request<AdminUser>("/auth/login", "POST", { email, password }),
  logout: () => request<void>("/auth/logout", "POST"),
};
