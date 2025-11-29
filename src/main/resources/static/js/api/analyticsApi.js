import { API_BASE } from "../config/config.js";

async function requestJson(url, options = {}) {
    const { body, headers, ...rest } = options;
    const init = { ...rest };

    init.headers = {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        ...(headers || {})
    };

    if (body !== undefined) {
        init.body = typeof body === "string" ? body : JSON.stringify(body);
        if (!init.headers["Content-Type"]) {
            init.headers["Content-Type"] = "application/json";
        }
    }

    try {
        const res = await fetch(url, init);
        const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : await res.text();
        if (!res.ok) {
            const message = (data && data.message) || res.statusText || "Yêu cầu thất bại";
            return { ok: false, status: res.status, data, message };
        }
        return { ok: true, status: res.status, data };
    } catch (err) {
        return { ok: false, status: 0, data: null, message: err.message };
    }
}

export async function fetchSummary(userId, range = "MONTH") {
    if (!userId) return { ok: false, message: "Thiếu thông tin người dùng" };
    return requestJson(`${API_BASE}/api/transactions/report?userId=${userId}&range=${range}`);
}

export const analyticsApi = { fetchSummary };
