import { getUser } from "../utils/storageUtils.js";
import { getUserByUsername } from "../api/userApi.js";
import { fetchSummary } from "../api/analyticsApi.js";
import { fetchBudgetStatus, saveBudget } from "../api/budgetApi.js";

const state = {
    userId: null,
    currentRange: "MONTH",
};

const els = {
    rangeSelect: document.querySelector("#reportRange"),
    totalIncome: document.querySelector("[data-role=total-income]"),
    totalExpense: document.querySelector("[data-role=total-expense]"),
    netBalance: document.querySelector("[data-role=net-balance]"),
    rangeLabels: document.querySelectorAll("[data-role=range-label]"),
    categoryChart: document.querySelector("[data-role=category-chart]"),
    alertChip: document.querySelector("[data-role=alert-chip]"),
    budgetForm: document.querySelector("#budgetForm"),
    budgetStatus: document.querySelector("[data-role=budget-status]"),
    alertPanel: document.querySelector("[data-role=alert-panel]"),
    actualExpense: document.querySelector("[data-role=actual-expense]"),
    budgetRemaining: document.querySelector("[data-role=budget-remaining]"),
    budgetNet: document.querySelector("[data-role=budget-net]"),
    budgetRange: document.querySelector("[data-role=budget-range]")
};

function formatCurrency(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

async function loadUser() {
    const username = getUser();
    if (!username) return null;
    const res = await getUserByUsername(username);
    if (!res.ok) return null;
    state.userId = res.data.id;
    return state.userId;
}

async function loadSummary() {
    if (!state.userId) return;
    const res = await fetchSummary(state.userId, state.currentRange);
    if (!res.ok) {
        showAlertChip(res.message || "Không tải được thống kê");
        return;
    }
    const data = res.data;
    updateKpis(data);
    renderCategories(data.expenseByCategory || []);
}

function updateKpis(data) {
    els.totalIncome.textContent = formatCurrency(data.totalIncome);
    els.totalExpense.textContent = formatCurrency(data.totalExpense);
    els.netBalance.textContent = formatCurrency(data.netBalance);
    els.rangeLabels.forEach(el => {
        el.textContent = `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`;
    });
}

function renderCategories(categories) {
    els.categoryChart.innerHTML = "";
    if (!categories.length) {
        els.categoryChart.innerHTML = "<p class='chart-subtitle'>Chưa có dữ liệu chi tiêu</p>";
        return;
    }
    const max = Math.max(...categories.map(c => Number(c.expense || 0)), 1);
    categories.forEach(cat => {
        const percent = Math.round((Number(cat.expense || 0) / max) * 100);
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `
            <div class="bar-label">
                <span>${cat.category}</span>
                <strong>${formatCurrency(cat.expense)}</strong>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
        `;
        els.categoryChart.appendChild(row);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "--";
    try {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

function showAlertChip(message) {
    if (!els.alertChip) return;
    if (!message) {
        els.alertChip.hidden = true;
        return;
    }
    els.alertChip.hidden = false;
    els.alertChip.textContent = message;
}

function showAlertPanel(message, safe = false) {
    if (!els.alertPanel) return;
    if (!message) {
        els.alertPanel.textContent = "";
        els.alertPanel.classList.remove("alert-panel--safe");
        return;
    }
    els.alertPanel.textContent = message;
    els.alertPanel.classList.toggle("alert-panel--safe", safe);
}

async function loadBudgetStatus(period) {
    if (!state.userId) return;
    const res = await fetchBudgetStatus(state.userId, period);
    if (!res.ok) {
        showAlertPanel(res.message || "Chưa có dữ liệu ngân sách");
        return;
    }
    const data = res.data;
    els.actualExpense.textContent = formatCurrency(data.spent);
    els.budgetRemaining.textContent = formatCurrency(data.remaining);
    els.budgetNet.textContent = formatCurrency(data.netBalance);
    els.budgetRange.textContent = `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`;

    if (data.overBudget) {
        const msg = "Chi tiêu đã vượt ngưỡng cho kỳ này!";
        showAlertChip(msg);
        showAlertPanel(msg);
        alert(msg);
    } else if (data.unsafeBalance) {
        const msg = "Số dư ròng thấp hơn mức an toàn.";
        showAlertChip(msg);
        showAlertPanel(msg);
        alert(msg);
    } else {
        showAlertChip("");
        showAlertPanel("Ngân sách đang trong giới hạn an toàn.", true);
    }
}

function bindRangeSelect() {
    if (!els.rangeSelect) return;
    els.rangeSelect.addEventListener("change", async (e) => {
        state.currentRange = e.target.value;
        await loadSummary();
        await loadBudgetStatus(e.target.value === "WEEK" ? "WEEK" : "MONTH");
    });
}

function bindBudgetForm() {
    if (!els.budgetForm) return;
    els.budgetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!state.userId) return;
        const form = new FormData(els.budgetForm);
        const payload = {
            userId: state.userId,
            period: form.get("period"),
            amount: Number(form.get("amount")),
            safeBalance: form.get("safeBalance") ? Number(form.get("safeBalance")) : null
        };
        els.budgetStatus.textContent = "Đang lưu...";
        const res = await saveBudget(payload);
        if (!res.ok) {
            els.budgetStatus.textContent = res.message || "Không thể lưu ngân sách";
            return;
        }
        els.budgetStatus.textContent = "Đã lưu ngân sách";
        await loadBudgetStatus(payload.period);
    });
}

async function init() {
    const userId = await loadUser();
    if (!userId) {
        showAlertChip("Vui lòng đăng nhập để xem báo cáo.");
        return;
    }
    bindRangeSelect();
    bindBudgetForm();
    await loadSummary();
    await loadBudgetStatus("MONTH");
}

document.addEventListener("DOMContentLoaded", init);
