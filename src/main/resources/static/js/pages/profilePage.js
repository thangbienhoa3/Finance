import { userApi } from "../api/userApi.js";
import { getUser } from "../utils/storageUtils.js";

const STORAGE_KEY_PREFIX = "dooto-user-profile:";

const defaultProfile = {
    userId: null,
    username: "",
    fullName: "Nguyễn Thuý",
    role: "Chuyên gia phân tích tài chính cấp cao tại Dooto Finance",
    email: "nguyenthuy@dooto.finance",
    phone: "+84 912 345 678",
    address: "Tầng 12, Toà nhà Dooto, Quận 1, TP.HCM",
    birthday: "1990-07-22",
    status: "Đang hoạt động",
    joinDate: "12/03/2021",
    plan: "Doanh nghiệp Premium",
    goals:
        "Tăng trưởng danh mục đầu tư 12% mỗi năm, tối ưu chi phí cố định và chuẩn bị quỹ giáo dục cho con trong 5 năm tới.",
    priorities: [
        "Phân bổ lại danh mục ETF",
        "Gia tăng quỹ khẩn cấp lên 200 triệu",
        "Tối ưu chi phí vận hành gia đình"
    ]
};

function getStorageKey(username) {
    return `${STORAGE_KEY_PREFIX}${username || "guest"}`;
}

function parseProfile(raw) {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        const priorities = Array.isArray(parsed.priorities) ? parsed.priorities : defaultProfile.priorities;
        return { ...defaultProfile, ...parsed, priorities };
    } catch (error) {
        console.warn("Không thể đọc dữ liệu người dùng:", error);
        return null;
    }
}

function loadProfile(username) {
    const keysToTry = [getStorageKey(username)];
    if (username) {
        // tương thích dữ liệu cũ
        keysToTry.push("dooto-user-profile");
    }

    for (const key of keysToTry) {
        const raw = localStorage.getItem(key);
        const profile = parseProfile(raw);
        if (profile) {
            return profile;
        }
    }

    return { ...defaultProfile };
}

function saveProfile(username, profile) {
    try {
        localStorage.setItem(getStorageKey(username), JSON.stringify(profile));
    } catch (error) {
        console.warn("Không thể lưu dữ liệu người dùng:", error);
    }
}

function getInitials(name, fallback = "NT") {
    const source = name && name.trim() ? name : fallback;
    return source
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || fallback;
}

function formatBirthday(value) {
    if (!value) return "";

    let date = new Date(value);
    if (Number.isNaN(date.getTime()) && value.includes("/")) {
        const [day, month, year] = value.split("/");
        if (day && month && year) {
            date = new Date(`${year}-${month}-${day}`);
        }
    }

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("vi-VN");
}

function renderProfile(profile) {
    const bindings = {
        profileName: profile.fullName || profile.username || defaultProfile.fullName,
        profileRole: profile.role,
        profileEmail: profile.email,
        profilePhone: profile.phone,
        profileAddress: profile.address,
        profileBirthday: formatBirthday(profile.birthday),
        profileStatus: profile.status,
        profileJoinDate: profile.joinDate,
        profilePlan: profile.plan,
        profileGoals: profile.goals
    };

    Object.entries(bindings).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value || "—";
        }
    });

    const prioritiesWrapper = document.getElementById("profilePriorities");
    if (prioritiesWrapper) {
        prioritiesWrapper.innerHTML = "";
        const items = profile.priorities && profile.priorities.length ? profile.priorities : ["Chưa có ưu tiên được thiết lập"];
        items.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            prioritiesWrapper.appendChild(li);
        });
    }

    const initials = getInitials(profile.fullName, profile.username || defaultProfile.fullName);
    ["profileAvatar", "profileMenuAvatar"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = initials;
        }
    });

    const menuName = document.getElementById("profileMenuName");
    if (menuName) {
        menuName.textContent = profile.fullName || profile.username || defaultProfile.fullName;
    }

    const menuEmail = document.getElementById("profileMenuEmail");
    if (menuEmail) {
        menuEmail.textContent = profile.email || defaultProfile.email;
    }
}

function setFormValues(form, profile) {
    const mapping = {
        inputFullName: profile.fullName,
        inputRole: profile.role,
        inputEmail: profile.email,
        inputPhone: profile.phone,
        inputAddress: profile.address,
        inputBirthday: profile.birthday,
        inputGoals: profile.goals,
        inputPriorities: (profile.priorities || []).join("\n")
    };

    Object.entries(mapping).forEach(([id, value]) => {
        const field = form.querySelector(`#${id}`);
        if (field) {
            field.value = value || "";
        }
    });
}

function collectFormValues(form) {
    const prioritiesInput = form.querySelector("#inputPriorities");
    const priorities = prioritiesInput && prioritiesInput.value
        ? prioritiesInput.value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    return {
        fullName: form.querySelector("#inputFullName")?.value.trim(),
        role: form.querySelector("#inputRole")?.value.trim(),
        email: form.querySelector("#inputEmail")?.value.trim(),
        phone: form.querySelector("#inputPhone")?.value.trim(),
        address: form.querySelector("#inputAddress")?.value.trim(),
        birthday: form.querySelector("#inputBirthday")?.value,
        goals: form.querySelector("#inputGoals")?.value.trim(),
        priorities
    };
}

let statusClearTimer = null;
function showStatus(message, isError = false, autoClearMs = 0) {
    const statusEl = document.getElementById("profileFormStatus");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.toggle("is-visible", Boolean(message));
    statusEl.style.color = isError ? "#dc2626" : "var(--primary)";

    if (statusClearTimer) {
        window.clearTimeout(statusClearTimer);
        statusClearTimer = null;
    }

    if (message && autoClearMs > 0) {
        statusClearTimer = window.setTimeout(() => {
            statusClearTimer = null;
            showStatus("", false);
        }, autoClearMs);
    }
}

let passwordStatusTimer = null;
function showPasswordStatus(message, isError = false, autoClearMs = 0) {
    const statusEl = document.getElementById("passwordFormStatus");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.toggle("is-visible", Boolean(message));
    statusEl.style.color = isError ? "#dc2626" : "var(--primary)";

    if (passwordStatusTimer) {
        window.clearTimeout(passwordStatusTimer);
        passwordStatusTimer = null;
    }

    if (message && autoClearMs > 0) {
        passwordStatusTimer = window.setTimeout(() => {
            passwordStatusTimer = null;
            showPasswordStatus("", false);
        }, autoClearMs);
    }
}

function setFormDisabled(form, disabled) {
    if (!form) return;
    Array.from(form.elements || []).forEach((element) => {
        if ("disabled" in element) {
            element.disabled = disabled;
        }
    });
}

function applyRemoteUser(profile, user) {
    if (!user) {
        return profile;
    }

    const remoteName = typeof user.name === "string" ? user.name.trim() : user.name;
    const remoteEmail = typeof user.email === "string" ? user.email.trim() : user.email;
    const remoteUsername = typeof user.username === "string" ? user.username.trim() : user.username;

    return {
        ...profile,
        userId: user.id ?? profile.userId ?? null,
        username: remoteUsername || profile.username || "",
        fullName: remoteName || profile.fullName || remoteUsername || profile.email || defaultProfile.fullName,
        email: remoteEmail || profile.email,

        phone: user.phone || profile.phone,
        address: user.address || profile.address,
        role: user.role || profile.role,
        birthday: user.birthday || profile.birthday,
        goals: user.goals || profile.goals,
        priorities: user.priorities || profile.priorities,
        status: user.status || profile.status,
        joinDate: user.joinDate || profile.joinDate,
        plan: user.plan || profile.plan
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");
    if (!form) return;

    const username = getUser();
    let account = { id: null, username: username || "" };
    let profile = loadProfile(username);

    renderProfile(profile);
    setFormValues(form, profile);

    const disableAllForms = (disabled) => {
        setFormDisabled(form, disabled);
        setFormDisabled(passwordForm, disabled);
    };

    if (!username) {
        disableAllForms(true);
        showStatus("Vui lòng đăng nhập để chỉnh sửa thông tin cá nhân.", true);
        showPasswordStatus("Bạn cần đăng nhập trước khi đổi mật khẩu.", true);
        return;
    }

    (async () => {
        disableAllForms(true);
        showStatus("Đang tải dữ liệu từ máy chủ...");
        const response = await userApi.getUserByUsername(username);

        if (response.ok && response.data) {
            account = {
                id: response.data.id,
                username: response.data.username || username
            };
            profile = applyRemoteUser(profile, response.data);
            saveProfile(username, profile);
            renderProfile(profile);
            setFormValues(form, profile);
            showStatus("");
            showPasswordStatus("");
            disableAllForms(false);
        } else {
            const message = response.message || "Không thể tải dữ liệu người dùng.";
            showStatus(message, true);
            showPasswordStatus(message, true);
        }
    })();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const updatedProfile = { ...profile, ...collectFormValues(form) };

        if (!updatedProfile.fullName || !updatedProfile.email) {
            showStatus("Vui lòng điền đầy đủ họ tên và email.", true);
            return;
        }

        if (!account.id) {
            showStatus("Không thể cập nhật vì chưa xác định được tài khoản trên hệ thống.", true);
            return;
        }

        setFormDisabled(form, true);
        showStatus("Đang lưu thay đổi...");

        try {
            const payload = {
                name: updatedProfile.fullName,
                email: updatedProfile.email,
                phone: updatedProfile.phone,
                address: updatedProfile.address,
                role: updatedProfile.role,
            };

            const response = await userApi.updateUser(account.id, payload);

            if (!response.ok) {
                showStatus(response.message || "Không thể cập nhật thông tin.", true);
                return;
            }

            const savedUser = response.data;
            if (savedUser) {
                account = {
                    id: savedUser.id,
                    username: savedUser.username || account.username
                };
                updatedProfile.fullName = savedUser.name || updatedProfile.fullName;
                updatedProfile.email = savedUser.email || updatedProfile.email;
                updatedProfile.phone = savedUser.phone || updatedProfile.phone;
                updatedProfile.address = savedUser.address || updatedProfile.address;
                updatedProfile.role = savedUser.role || updatedProfile.role;
            }

            profile = {
                ...updatedProfile,
                userId: account.id,
                username: account.username
            };

            saveProfile(username, profile);
            renderProfile(profile);
            setFormValues(form, profile);
            showStatus(response.message || "Thông tin của bạn đã được cập nhật.", false, 2600);
        } finally {
            setFormDisabled(form, false);
        }
    });

    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!account.id) {
                showPasswordStatus("Không thể đổi mật khẩu vì chưa xác định được tài khoản.", true);
                return;
            }

            const oldPassword = passwordForm.querySelector("#currentPassword")?.value.trim();
            const newPassword = passwordForm.querySelector("#newPassword")?.value.trim();
            const confirmPassword = passwordForm.querySelector("#confirmNewPassword")?.value.trim();

            if (!oldPassword || !newPassword || !confirmPassword) {
                showPasswordStatus("Vui lòng nhập đầy đủ các trường bắt buộc.", true);
                return;
            }

            if (newPassword.length < 6) {
                showPasswordStatus("Mật khẩu mới phải có ít nhất 6 ký tự.", true);
                return;
            }

            if (newPassword !== confirmPassword) {
                showPasswordStatus("Xác nhận mật khẩu mới chưa khớp.", true);
                return;
            }

            setFormDisabled(passwordForm, true);
            showPasswordStatus("Đang cập nhật mật khẩu...");

            try {
                const response = await userApi.changePassword(account.id, {
                    oldPassword,
                    newPassword,
                    confirmPassword
                });

                if (!response.ok) {
                    showPasswordStatus(response.message || "Không thể đổi mật khẩu.", true);
                    return;
                }

                passwordForm.reset();
                showPasswordStatus(response.message || "Đổi mật khẩu thành công.", false, 2600);
            } finally {
                setFormDisabled(passwordForm, false);
            }
        });
    }
});