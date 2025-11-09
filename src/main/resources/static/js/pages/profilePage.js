const STORAGE_KEY = 'dooto-user-profile';

const defaultProfile = {
    fullName: 'Nguyễn Thuý',
    role: 'Chuyên gia phân tích tài chính cấp cao tại Dooto Finance',
    email: 'nguyenthuy@dooto.finance',
    phone: '+84 912 345 678',
    address: 'Tầng 12, Toà nhà Dooto, Quận 1, TP.HCM',
    birthday: '1990-07-22',
    status: 'Đang hoạt động',
    joinDate: '12/03/2021',
    plan: 'Doanh nghiệp Premium',
    goals: 'Tăng trưởng danh mục đầu tư 12% mỗi năm, tối ưu chi phí cố định và chuẩn bị quỹ giáo dục cho con trong 5 năm tới.',
    priorities: [
        'Phân bổ lại danh mục ETF',
        'Gia tăng quỹ khẩn cấp lên 200 triệu',
        'Tối ưu chi phí vận hành gia đình'
    ]
};

function loadProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { ...defaultProfile };
        }
        const parsed = JSON.parse(raw);
        return { ...defaultProfile, ...parsed, priorities: parsed.priorities || defaultProfile.priorities };
    } catch (error) {
        console.warn('Không thể đọc dữ liệu người dùng:', error);
        return { ...defaultProfile };
    }
}

function saveProfile(profile) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.warn('Không thể lưu dữ liệu người dùng:', error);
    }
}

function getInitials(name) {
    if (!name) return 'NT';
    return name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('');
}

function formatBirthday(value) {
    if (!value) return '';

    let date = new Date(value);
    if (Number.isNaN(date.getTime()) && value.includes('/')) {
        const [day, month, year] = value.split('/');
        if (day && month && year) {
            date = new Date(`${year}-${month}-${day}`);
        }
    }

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('vi-VN');
}

function renderProfile(profile) {
    const bindings = {
        profileName: profile.fullName,
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
            el.textContent = value || '—';
        }
    });

    const prioritiesWrapper = document.getElementById('profilePriorities');
    if (prioritiesWrapper) {
        prioritiesWrapper.innerHTML = '';
        (profile.priorities && profile.priorities.length ? profile.priorities : ['Chưa có ưu tiên được thiết lập']).forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            prioritiesWrapper.appendChild(li);
        });
    }

    const initials = getInitials(profile.fullName);
    ['profileAvatar', 'profileMenuAvatar'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = initials;
        }
    });

    const menuName = document.getElementById('profileMenuName');
    if (menuName) {
        menuName.textContent = profile.fullName;
    }

    const menuEmail = document.getElementById('profileMenuEmail');
    if (menuEmail) {
        menuEmail.textContent = profile.email;
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
        inputPriorities: (profile.priorities || []).join('\n')
    };

    Object.entries(mapping).forEach(([id, value]) => {
        const field = form.querySelector(`#${id}`);
        if (field) {
            field.value = value || '';
        }
    });
}

function collectFormValues(form) {
    const prioritiesInput = form.querySelector('#inputPriorities');
    const priorities = prioritiesInput && prioritiesInput.value
        ? prioritiesInput.value
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    return {
        fullName: form.querySelector('#inputFullName')?.value.trim(),
        role: form.querySelector('#inputRole')?.value.trim(),
        email: form.querySelector('#inputEmail')?.value.trim(),
        phone: form.querySelector('#inputPhone')?.value.trim(),
        address: form.querySelector('#inputAddress')?.value.trim(),
        birthday: form.querySelector('#inputBirthday')?.value,
        goals: form.querySelector('#inputGoals')?.value.trim(),
        priorities
    };
}

function showStatus(message, isError = false) {
    const statusEl = document.getElementById('profileFormStatus');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.toggle('is-visible', Boolean(message));
    statusEl.style.color = isError ? '#dc2626' : 'var(--primary)';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const profile = loadProfile();
    renderProfile(profile);
    setFormValues(form, profile);

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const updatedProfile = { ...profile, ...collectFormValues(form) };

        if (!updatedProfile.fullName || !updatedProfile.email) {
            showStatus('Vui lòng điền đầy đủ họ tên và email.', true);
            return;
        }

        profile.fullName = updatedProfile.fullName;
        profile.role = updatedProfile.role;
        profile.email = updatedProfile.email;
        profile.phone = updatedProfile.phone;
        profile.address = updatedProfile.address;
        profile.birthday = updatedProfile.birthday;
        profile.goals = updatedProfile.goals;
        profile.priorities = updatedProfile.priorities;

        saveProfile(profile);
        renderProfile(profile);
        showStatus('Thông tin của bạn đã được cập nhật.');

        window.setTimeout(() => {
            showStatus('');
        }, 2600);
    });
});
