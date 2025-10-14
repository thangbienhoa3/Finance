import { userApi } from "../api/userApi.js";

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnRegister");
    const u = document.getElementById("r-username");
    const e = document.getElementById("r-email");
    const p = document.getElementById("r-password");
    const msg = document.getElementById("regMsg");

    async function handleRegister() {
        const username = u.value.trim();
        const email = e.value.trim();
        const password = p.value.trim();

        // Basic validation
        if (!username || !email || !password) {
            msg.textContent = "Nhập đủ cả 3 trường username, email và mật khẩu!";
            msg.style.color = "red";
            return;
        }

        if (!email.includes("@")) {
            msg.textContent = "Email không hợp lệ!";
            msg.style.color = "red";
            return;
        }

        if (password.length < 6) {
            msg.textContent = "Mật khẩu phải có ít nhất 6 ký tự!";
            msg.style.color = "red";
            return;
        }

        btn.disabled = true;
        msg.textContent = "Đang tạo tài khoản...";

        try {
            const { ok, text } = await userApi.register(username, password, email);
            msg.textContent = text;
            msg.style.color = ok ? "green" : "red";

            if (ok) {
                setTimeout(() => (window.location.href = "login.html"), 1000);
            }
        } catch (error) {
            msg.textContent = "Lỗi kết nối server!";
            msg.style.color = "red";
            console.error("Register error:", error);
        } finally {
            btn.disabled = false;
        }
    }

    btn.addEventListener("click", handleRegister);
    [u, e, p].forEach((el) =>
        el.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") handleRegister();
        })
    );
});
