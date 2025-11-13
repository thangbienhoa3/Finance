import {
    fetchTransactions,
    deleteTransaction,
    updateTransaction,
    createTransaction
} from "../api/transactionApi.js";

import { getUser } from "../utils/storageUtils.js";
import { getUserByUsername } from "../api/userApi.js";

/* ========================= GLOBAL STATE ========================= */
const state = {
    transactions: [],
    editing: null,
    currentUserId: null
};

/* ========================= ELEMENTS ========================= */
const elements = {
    tableBody: document.querySelector("[data-role=transaction-body]"),
    message: document.querySelector("[data-role=transaction-message]"),
    searchInput: document.querySelector("#transactionSearch"),
    typeFilter: document.querySelector("#transactionTypeFilter"),
    categoryFilter: document.querySelector("#transactionCategoryFilter"),
    dateFrom: document.querySelector("#transactionDateFrom"),
    dateTo: document.querySelector("#transactionDateTo"),
    resetFilters: document.querySelector("#transactionResetFilters"),

    editor: document.querySelector("#transactionEditor"),
    editForm: document.querySelector("#transactionEditForm"),
    editTitle: document.querySelector("[data-role=transaction-edit-title]"),

    createForm: document.querySelector("#transactionCreateForm"),
    createStatus: document.querySelector("[data-role=transaction-create-status]"),

    hiddenUserId: document.querySelector("#currentUserId")
};

/* ========================= LOAD USER ID ========================= */
async function loadCurrentUserId() {
    const username = getUser();
    if (!username) {
        showMessage("Bạn chưa đăng nhập!", "error");
        return null;
    }
    try {
        const response = await getUserByUsername(username);
        console.log(response);
        if (!response.ok) {
            showMessage("Không thể tải thông tin người dùng!", "error");
            return null;
        }

        const user = response.data; // userApi.js trả user trong data
        state.currentUserId = user.id;

        if (elements.hiddenUserId) {
            elements.hiddenUserId.value = user.id;
        }

        return user.id;
    } catch (err) {
        console.error(err);
        showMessage("Không thể kết nối tới máy chủ!", "error");
        return null;
    }
}

/* ========================= UTILS ========================= */
function sortTransactions(list) {
    return list.slice().sort((a, b) => {
        const dateCompare = (b.transactionDate || "").localeCompare(a.transactionDate || "");
        if (dateCompare !== 0) return dateCompare;
        return Number(b.id) - Number(a.id);
    });
}

function formatCurrency(amount, type) {
    if (amount == null) return "--";
    const v = Number(amount);
    if (isNaN(v)) return amount;

    const f = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Math.abs(v));

    return type === "EXPENSE" ? `- ${f}` : `+ ${f}`;
}

function formatDate(d) {
    if (!d) return "--";
    try {
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
    } catch {
        return d;
    }
}

function translateType(type) {
    return type === "INCOME" ? "Thu nhập" :
        type === "EXPENSE" ? "Chi tiêu" :
            "--";
}

function showMessage(msg, variant = "info") {
    if (!elements.message) return;
    if (!msg) {
        elements.message.hidden = true;
        elements.message.textContent = "";
        return;
    }
    elements.message.hidden = false;
    elements.message.textContent = msg;
    elements.message.className = `transaction-message transaction-message--${variant}`;
}

function showCreateStatus(msg, variant = "info") {
    if (!elements.createStatus) return;
    if (!msg) {
        elements.createStatus.hidden = true;
        elements.createStatus.textContent = "";
        return;
    }
    elements.createStatus.hidden = false;
    elements.createStatus.textContent = msg;
    elements.createStatus.className = `transaction-create__status transaction-create__status--${variant}`;
}

/* ========================= RENDER ========================= */
function renderTransactions(list) {
    elements.tableBody.innerHTML = "";

    if (list.length === 0) {
        elements.tableBody.innerHTML = `
            <tr><td colspan="7" class="transaction-empty">Không có giao dịch phù hợp.</td></tr>
        `;
        return;
    }

    list.forEach(t => {
        const tr = document.createElement("tr");
        tr.dataset.transactionId = t.id;

        tr.innerHTML = `
            <td>${t.id}</td>
            <td>${formatDate(t.transactionDate)}</td>
            <td>${t.description || "(Không mô tả)"}</td>
            <td>${t.category || "--"}</td>
            <td><span class="tag ${t.type === "INCOME" ? "tag--income":"tag--expense"}">${translateType(t.type)}</span></td>
            <td class="${t.type === "INCOME" ? "amount-positive":"amount-negative"}">${formatCurrency(t.amount, t.type)}</td>
            <td class="transaction-actions">
                <button class="action-btn action-btn--edit" data-action="edit" data-id="${t.id}">Sửa</button>
                <button class="action-btn action-btn--delete" data-action="delete" data-id="${t.id}">Xoá</button>
            </td>
        `;

        elements.tableBody.appendChild(tr);
    });
}

/* ========================= FILTER ========================= */
function collectFilters() {
    return {
        term: elements.searchInput.value.trim().toLowerCase(),
        type: elements.typeFilter.value,
        category: elements.categoryFilter.value,
        from: elements.dateFrom.value,
        to: elements.dateTo.value
    };
}

function applyFilters() {
    const filters = collectFilters();

    const filtered = state.transactions.filter(t => {
        if (filters.type && t.type !== filters.type) return false;
        if (filters.category && t.category !== filters.category) return false;
        if (filters.from && t.transactionDate < filters.from) return false;
        if (filters.to && t.transactionDate > filters.to) return false;

        if (filters.term) {
            const text = `${t.description} ${t.category} ${t.type}`.toLowerCase();
            if (!text.includes(filters.term)) return false;
        }

        return true;
    });

    renderTransactions(filtered);
}

function resetFilters() {
    elements.searchInput.value = "";
    elements.typeFilter.value = "";
    elements.categoryFilter.value = "";
    elements.dateFrom.value = "";
    elements.dateTo.value = "";
    applyFilters();
}

function populateCategoryFilter() {
    const categories = [...new Set(state.transactions.map(t => t.category).filter(Boolean))];

    elements.categoryFilter.innerHTML = `<option value="">Tất cả danh mục</option>`;
    categories.forEach(c => {
        const op = document.createElement("option");
        op.value = c;
        op.textContent = c;
        elements.categoryFilter.appendChild(op);
    });
}

/* ========================= DELETE ========================= */
async function handleDelete(id) {
    const t = state.transactions.find(x => x.id == id);
    if (!t) return;

    if (!confirm(`Bạn có chắc muốn xoá giao dịch "${t.description}"?`)) return;

    try {
        showMessage("Đang xoá giao dịch...");
        await deleteTransaction(id);

        state.transactions = state.transactions.filter(x => x.id != id);
        applyFilters();
        showMessage("Đã xoá giao dịch", "success");
    } catch (err) {
        showMessage(err.message || "Không thể xoá", "error");
    }
}

/* ========================= EDITOR ========================= */
function openEditor(t) {
    state.editing = t;

    elements.editForm.description.value = t.description || "";
    elements.editForm.category.value = t.category || "";
    elements.editForm.amount.value = Math.abs(t.amount);
    elements.editForm.type.value = t.type;
    elements.editForm.transactionDate.value = t.transactionDate || "";

    elements.editTitle.textContent = `Chỉnh sửa giao dịch #${t.id}`;

    elements.editor.showModal();
}

function closeEditor() {
    state.editing = null;
    elements.editor.close();
}

/* ========================= CREATE ========================= */
function bindCreateForm() {
    if (!elements.createForm) return;

    elements.createForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = elements.createForm;

        if (!state.currentUserId) {
            showCreateStatus("Không tìm thấy userId!", "error");
            return;
        }

        const amountValue = parseFloat(f.amount.value);
        if (isNaN(amountValue) || amountValue < 0) {
            showCreateStatus("Số tiền không hợp lệ", "error");
            return;
        }

        const payload = {
            userId: state.currentUserId,
            description: f.description.value.trim(),
            category: f.category.value.trim() || null,
            amount: Math.abs(amountValue),
            type: f.type.value,
            transactionDate: f.transactionDate.value || null
        };
        console.log("Creating transaction with payload:", payload);

        showCreateStatus("Đang tạo...", "info");

        try {
            const created = await createTransaction(payload);
            state.transactions = sortTransactions([created, ...state.transactions]);
            populateCategoryFilter();
            applyFilters();

            showCreateStatus("Tạo giao dịch thành công", "success");
            showMessage("Đã thêm giao dịch mới", "success");
            f.reset();
        } catch (error) {
            showCreateStatus(error.message || "Không thể tạo giao dịch", "error");
        }
    });
}

/* ========================= TABLE EVENTS ========================= */
function registerTableEvents() {
    elements.tableBody.addEventListener("click", e => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.dataset.action === "delete") handleDelete(id);
        if (btn.dataset.action === "edit") {
            const t = state.transactions.find(x => x.id == id);
            openEditor(t);
        }
    });
}

/* ========================= EDIT EVENTS ========================= */
function bindEditorEvents() {
    elements.editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = elements.editForm;

        const amountValue = parseFloat(f.amount.value);
        if (isNaN(amountValue)) {
            showMessage("Số tiền không hợp lệ", "error");
            return;
        }

        const payload = {
            description: f.description.value.trim(),
            category: f.category.value.trim() || null,
            amount: Math.abs(amountValue),
            type: f.type.value,
            transactionDate: f.transactionDate.value || null
        };

        try {
            showMessage("Đang cập nhật...", "info");
            const updated = await updateTransaction(state.editing.id, payload);

            state.transactions = state.transactions.map(x => x.id == updated.id ? updated : x);
            applyFilters();

            showMessage("Đã cập nhật giao dịch", "success");
            closeEditor();
        } catch (err) {
            showMessage(err.message || "Không thể cập nhật", "error");
        }
    });

    elements.editForm.querySelector("[data-action=cancel-edit]")
        .addEventListener("click", (e) => {
            e.preventDefault();
            closeEditor();
        });
}

/* ========================= LOAD TRANSACTIONS ========================= */
async function loadTransactions() {
    try {
        showMessage("Đang tải dữ liệu...", "info");
        const uid = state.currentUserId;
        const data = await fetchTransactions(uid);
        state.transactions = sortTransactions(data || []);

        populateCategoryFilter();
        applyFilters();

        showMessage("", "info");
    } catch (err) {
        renderTransactions([]);
        showMessage(err.message || "Không tải được giao dịch", "error");
    }
}

/* ========================= INIT ========================= */
async function init() {
    const uid = await loadCurrentUserId();
    if (!uid) return;

    registerTableEvents();
    bindFilterEvents();
    bindEditorEvents();
    bindCreateForm();

    await loadTransactions();
}

function bindFilterEvents() {
    [
        elements.searchInput,
        elements.typeFilter,
        elements.categoryFilter,
        elements.dateFrom,
        elements.dateTo
    ].forEach(el => {
        if (!el) return;
        el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });

    elements.resetFilters.addEventListener("click", resetFilters);
}

document.addEventListener("DOMContentLoaded", init);
