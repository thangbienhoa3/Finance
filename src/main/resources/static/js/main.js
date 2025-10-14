

const API_BASE = location.origin;

// Hàm tiện ích gửi POST form-urlencoded để Spring nhận @RequestParam đúng format
async function postForm(url, params) {
    const body = new URLSearchParams(params);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
    });
    const text = await res.text();
    return { ok: res.ok && /successfully/i.test(text), text };
}

// LOGIN
async function login(username, password) {
    if (!username || !password)
        return { ok: false, text: 'Vui lòng nhập đủ username và password ' };

    const url = `${API_BASE}/users/login`;
    return postForm(url, { username, password });
}

// REGISTER
async function register(username, password, email) {
    if (!username || !password || !email)
        return { ok: false, text: 'Nhập đủ 3 trường đi bạn ơi' };

    const url = `${API_BASE}/users/register`;
    return postForm(url, { username, password, email });
}
