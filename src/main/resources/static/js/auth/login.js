
import { userApi } from "../api/userApi.js";
import { saveUser } from "../utils/storageUtils.js";

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnLogin");
    const u = document.getElementById("username");
    const p = document.getElementById("password");
    const msg = document.getElementById("loginMsg");

    async function handleLogin() {
        const username = u.value.trim();
        const password = p.value.trim();

        if (!username || !password) {
            msg.textContent = "Nhập đầy đủ username và mật khẩu!";
            msg.style.color = "red";
            return;
        }

        btn.disabled = true;
        msg.textContent = "Đang đăng nhập...";

        try {
            const { ok, text } = await userApi.login(username, password);
            msg.textContent = text;
            msg.style.color = ok ? "green" : "red";

            if (ok) {
                console.log("login.js loaded!");
                saveUser(username);
                setTimeout(() => (window.location.href = "hello.html"), 1000);
            }
        } catch (error) {
            msg.textContent = "Lỗi kết nối server!";
            msg.style.color = "red";
            console.error("Login error:", error);
        } finally {
            btn.disabled = false;
        }
    }

    btn.addEventListener("click", handleLogin);
    [u, p].forEach((el) =>
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleLogin();
        })
    );
});
