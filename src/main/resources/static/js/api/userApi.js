import { API_BASE } from "../config/config.js";

async function postForm(url, params) {
    try {
        const body = new URLSearchParams(params);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body
        });
        const text = await res.text();
        return { ok: res.ok && /successfully/i.test(text), text };
    } catch (err) {
        return { ok: false, text: "Server unreachable: " + err.message };
    }
}

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
        const contentType = res.headers.get("content-type") || "";
        let data = null;

        if (contentType.includes("application/json")) {
            try {
                data = await res.json();
            } catch (error) {
                data = null;
            }
        } else {
            const text = await res.text();
            data = text || null;
        }

        const base = { ok: res.ok, status: res.status, data };

        if (!res.ok) {
            const message =
                (data && typeof data === "object" && data !== null && "message" in data && data.message) ||
                (typeof data === "string" && data) ||
                res.statusText ||
                "Yêu cầu thất bại.";
            return { ...base, message };
        }

        const message = typeof data === "string" ? data : null;
        return message ? { ...base, message } : base;
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            message: "Không thể kết nối máy chủ: " + err.message
        };
    }
}

async function listUsers() {
    return requestJson(`${API_BASE}/users`, { method: "GET" });
}

export async function getUserByUsername(username) {
    if (!username) {
        return {
            ok: false,
            status: 400,
            data: null,
            message: "Thiếu tên đăng nhập để tải thông tin người dùng."
        };
    }
    // console.log(username);
    try {
        const res = await fetch(`${API_BASE}/users/by-username/${username}`);
        if (!res.ok) {
            return { ok: false, message: "User not found" };
        }
        const data = await res.json();
        return { ok: true, data };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

async function updateUser(userId, payload) {
    if (!userId) {
        return {
            ok: false,
            status: 400,
            data: null,
            message: "Thiếu mã người dùng để cập nhật."
        };
    }

    return requestJson(`${API_BASE}/users/${userId}`, {
        method: "PUT",
        body: payload
    });
}

async function changePassword(userId, payload) {
    if (!userId) {
        return {
            ok: false,
            status: 400,
            data: null,
            message: "Thiếu mã người dùng để đổi mật khẩu."
        };
    }

    return requestJson(`${API_BASE}/users/${userId}/change-password`, {
        method: "POST",
        body: payload
    });
}

export const userApi = {
    login: (username, password) => postForm(`${API_BASE}/users/login`, { username, password }),
    register: (username, password, email) => postForm(`${API_BASE}/users/register`, { username, password, email }),
    listUsers,
    getUserByUsername,
    updateUser,
    changePassword
};
