import {API_BASE} from "../config/config.js";

async function postForm(url, params) {
    try {
        const body = new URLSearchParams(params);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body
        });
        const text = await res.text();
        return { ok: res.ok && /successfully/i.test(text), text };
    } catch {
        return { ok: false, text: "Server unreachable: " + err.message };
    }


}

export const userApi = {
    login: (username, password) => postForm(`${API_BASE}/users/login`, { username, password }),
    register: (username, password, email) => postForm(`${API_BASE}/users/register`, { username, password, email })
};