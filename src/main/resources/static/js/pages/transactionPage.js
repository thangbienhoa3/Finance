import {
    fetchTransactions,
    deleteTransaction,
    updateTransaction
} from "../api/transactionApi.js";

const state = {
    transactions: [],
    editing: null
};

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
    editTitle: document.querySelector("[data-role=transaction-edit-title]")
};

function formatCurrency(amount, type) {
    if (amount === null || amount === undefined) return "--";
    const value = Number(amount);
    if (Number.isNaN(value)) return amount;
    const formatter = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    });
    const formatted = formatter.format(Math.abs(value));
    return type === "EXPENSE" ? `- ${formatted}` : `+ ${formatted}`;
}

function formatDate(date) {
    if (!date) return "--";
    try {
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
    } catch (e) {
        return date;
    }
}

function translateType(type) {
    if (type === "INCOME") return "Thu nhập";
    if (type === "EXPENSE") return "Chi tiêu";
    return type || "--";
}

function renderTransactions(list) {
    if (!elements.tableBody) return;
    elements.tableBody.innerHTML = "";

    if (!list.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "Không có giao dịch phù hợp.";
        cell.className = "transaction-empty";
        row.appendChild(cell);
        elements.tableBody.appendChild(row);
        return;
    }

    list.forEach((transaction) => {
        const row = document.createElement("tr");
        row.dataset.transactionId = transaction.id;

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(transaction.transactionDate);
        row.appendChild(dateCell);

        const descCell = document.createElement("td");
        descCell.textContent = transaction.description || "(Không có mô tả)";
        row.appendChild(descCell);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category || "--";
        row.appendChild(categoryCell);

        const statusCell = document.createElement("td");
        const tag = document.createElement("span");
        tag.className = `tag ${transaction.type === "INCOME" ? "tag--income" : "tag--expense"}`;
        tag.textContent = translateType(transaction.type);
        statusCell.appendChild(tag);
        row.appendChild(statusCell);

        const amountCell = document.createElement("td");
        amountCell.textContent = formatCurrency(transaction.amount, transaction.type);
        amountCell.className = transaction.type === "INCOME" ? "amount-positive" : "amount-negative";
        row.appendChild(amountCell);

        const actionsCell = document.createElement("td");
        actionsCell.className = "transaction-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Sửa";
        editButton.className = "action-btn action-btn--edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = transaction.id;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Xoá";
        deleteButton.className = "action-btn action-btn--delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = transaction.id;

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        elements.tableBody.appendChild(row);
    });
}

function showMessage(message, variant = "info") {
    if (!elements.message) return;
    if (!message) {
        elements.message.textContent = "";
        elements.message.className = "transaction-message";
        elements.message.hidden = true;
        return;
    }
    elements.message.hidden = false;
    elements.message.textContent = message;
    elements.message.className = `transaction-message transaction-message--${variant}`;
}

function collectFilters() {
    return {
        term: (elements.searchInput?.value || "").trim().toLowerCase(),
        type: elements.typeFilter?.value || "",
        category: elements.categoryFilter?.value || "",
        from: elements.dateFrom?.value || "",
        to: elements.dateTo?.value || ""
    };
}

function applyFilters() {
    const filters = collectFilters();
    const filtered = state.transactions.filter((transaction) => {
        if (filters.type && transaction.type !== filters.type) {
            return false;
        }
        if (filters.category && transaction.category !== filters.category) {
            return false;
        }
        if (filters.from && transaction.transactionDate && transaction.transactionDate < filters.from) {
            return false;
        }
        if (filters.to && transaction.transactionDate && transaction.transactionDate > filters.to) {
            return false;
        }
        if (filters.term) {
            const haystack = [
                transaction.description || "",
                transaction.category || "",
                transaction.type || ""
            ].join(" ").toLowerCase();
            if (!haystack.includes(filters.term)) {
                return false;
            }
        }
        return true;
    });

    renderTransactions(filtered);
}

function resetFilters() {
    if (elements.searchInput) elements.searchInput.value = "";
    if (elements.typeFilter) elements.typeFilter.value = "";
    if (elements.categoryFilter) elements.categoryFilter.value = "";
    if (elements.dateFrom) elements.dateFrom.value = "";
    if (elements.dateTo) elements.dateTo.value = "";
    applyFilters();
}

function populateCategoryFilter() {
    if (!elements.categoryFilter) return;
    const currentValue = elements.categoryFilter.value;
    const categories = Array.from(
        new Set(
            state.transactions
                .map((transaction) => transaction.category)
                .filter((category) => category && category.trim().length > 0)
        )
    ).sort((a, b) => a.localeCompare(b));

    elements.categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>';
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        elements.categoryFilter.appendChild(option);
    });

    if (currentValue && categories.includes(currentValue)) {
        elements.categoryFilter.value = currentValue;
    }
}

function bindFilterEvents() {
    [
        elements.searchInput,
        elements.typeFilter,
        elements.categoryFilter,
        elements.dateFrom,
        elements.dateTo
    ].forEach((element) => {
        if (!element) return;
        const eventName = element.tagName === "SELECT" ? "change" : "input";
        element.addEventListener(eventName, applyFilters);
    });

    elements.resetFilters?.addEventListener("click", resetFilters);
}

function getTransactionById(id) {
    return state.transactions.find((transaction) => Number(transaction.id) === Number(id)) || null;
}

function openEditor(transaction) {
    if (!elements.editor || !elements.editForm) return;
    state.editing = transaction;

    elements.editForm.reset();
    elements.editForm.querySelector("[name=description]").value = transaction.description || "";
    elements.editForm.querySelector("[name=category]").value = transaction.category || "";
    const amountInput = elements.editForm.querySelector("[name=amount]");
    const rawAmount = Number(transaction.amount);
    amountInput.value = Number.isNaN(rawAmount)
        ? (transaction.amount ?? "")
        : Math.abs(rawAmount);
    elements.editForm.querySelector("[name=type]").value = transaction.type || "INCOME";
    elements.editForm.querySelector("[name=transactionDate]").value = transaction.transactionDate || "";

    if (elements.editTitle) {
        elements.editTitle.textContent = `Chỉnh sửa giao dịch #${transaction.id}`;
    }

    if (typeof elements.editor.showModal === "function") {
        elements.editor.showModal();
    } else {
        elements.editor.setAttribute("open", "open");
    }
}

function closeEditor() {
    state.editing = null;
    if (!elements.editor) return;
    if (typeof elements.editor.close === "function") {
        elements.editor.close();
    } else {
        elements.editor.removeAttribute("open");
    }
}

async function handleDelete(id) {
    const transaction = getTransactionById(id);
    if (!transaction) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xoá giao dịch "${transaction.description || "(không có mô tả)"}"?`);
    if (!confirmed) return;

    try {
        showMessage("Đang xoá giao dịch...", "info");
        await deleteTransaction(id);
        state.transactions = state.transactions.filter((item) => Number(item.id) !== Number(id));
        populateCategoryFilter();
        applyFilters();
        showMessage("Đã xoá giao dịch thành công", "success");
    } catch (error) {
        showMessage(error.message || "Không thể xoá giao dịch", "error");
    }
}

function registerTableEvents() {
    if (!elements.tableBody) return;
    elements.tableBody.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = button.dataset.id;
        if (button.dataset.action === "delete") {
            handleDelete(id);
        }
        if (button.dataset.action === "edit") {
            const transaction = getTransactionById(id);
            if (transaction) {
                openEditor(transaction);
            }
        }
    });
}

function bindEditorEvents() {
    if (!elements.editForm) return;
    elements.editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!state.editing) return;

        const form = elements.editForm;
        const amountValue = parseFloat(form.amount.value);
        if (Number.isNaN(amountValue)) {
            showMessage("Số tiền không hợp lệ", "error");
            return;
        }

        const payload = {
            description: form.description.value.trim(),
            category: form.category.value.trim(),
            amount: Math.abs(amountValue),
            type: form.type.value,
            transactionDate: form.transactionDate.value || null
        };

        try {
            showMessage("Đang lưu thay đổi...", "info");
            const updated = await updateTransaction(state.editing.id, payload);
            state.transactions = state.transactions.map((transaction) =>
                Number(transaction.id) === Number(updated.id) ? updated : transaction
            );
            populateCategoryFilter();
            applyFilters();
            showMessage("Đã cập nhật giao dịch", "success");
            closeEditor();
        } catch (error) {
            showMessage(error.message || "Không thể cập nhật giao dịch", "error");
        }
    });

    const cancelButton = elements.editForm.querySelector("[data-action=cancel-edit]");
    cancelButton?.addEventListener("click", (event) => {
        event.preventDefault();
        closeEditor();
    });
}

async function loadTransactions() {
    try {
        showMessage("Đang tải dữ liệu giao dịch...", "info");
        const data = await fetchTransactions();
        state.transactions = Array.isArray(data)
            ? data
                .slice()
                .sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || ""))
            : [];
        populateCategoryFilter();
        applyFilters();
        if (!state.transactions.length) {
            showMessage("Chưa có giao dịch nào", "info");
        } else {
            showMessage("", "info");
        }
    } catch (error) {
        renderTransactions([]);
        showMessage(error.message || "Không thể tải giao dịch", "error");
    }
}

function init() {
    if (!elements.tableBody) return;
    bindFilterEvents();
    registerTableEvents();
    bindEditorEvents();
    loadTransactions();
}

document.addEventListener("DOMContentLoaded", init);