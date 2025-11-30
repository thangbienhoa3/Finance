import { getUser } from "../utils/storageUtils.js";
import { getUserByUsername } from "../api/userApi.js";
import { fetchSummary } from "../api/analyticsApi.js";
import { fetchTransactions } from "../api/transactionApi.js";
import { fetchBudgets, fetchBudgetStatus } from "../api/budgetApi.js";

const state = {
    userId: null,
    transactions: [],
    summary: null,
    budgetStatus: null,
    budgets: []
};

const els = {
    userName: document.querySelector("[data-role=user-name]"),
    userEmail: document.querySelector("[data-role=user-email]"),
    userAvatar: document.querySelector("[data-role=user-avatar]"),

    reportRange: document.querySelector("[data-role=report-range]"),
    reportUpdated: document.querySelector("[data-role=report-updated]"),
    netBalance: document.querySelector("[data-role=net-balance]"),
    totalIncome: document.querySelector("[data-role=total-income]"),
    totalExpense: document.querySelector("[data-role=total-expense]"),
    transactionCount: document.querySelector("[data-role=transaction-count]"),
    netNote: document.querySelector("[data-role=net-note]"),

    kpiIncome: document.querySelector("[data-role=kpi-income]"),
    kpiExpense: document.querySelector("[data-role=kpi-expense]"),
    savingRate: document.querySelector("[data-role=saving-rate]"),
    recentCount: document.querySelector("[data-role=recent-count]"),
    incomeBar: document.querySelector("[data-role=income-bar]"),
    expenseBar: document.querySelector("[data-role=expense-bar]"),
    savingBar: document.querySelector("[data-role=saving-bar]"),
    recentBar: document.querySelector("[data-role=recent-bar]"),
    incomeChange: document.querySelector("[data-role=income-change]"),
    expenseChange: document.querySelector("[data-role=expense-change]"),
    savingDelta: document.querySelector("[data-role=saving-delta]"),
    recentChange: document.querySelector("[data-role=recent-change]"),

    cashflowChart: document.querySelector("[data-role=cashflow-chart]"),
    avgIncome: document.querySelector("[data-role=avg-income]"),
    avgExpense: document.querySelector("[data-role=avg-expense]"),
    avgSurplus: document.querySelector("[data-role=avg-surplus]"),
    cashflowRange: document.querySelector("[data-role=cashflow-range]"),

    categoryChart: document.querySelector("[data-role=category-chart]"),
    categoryNote: document.querySelector("[data-role=category-note]"),
    categoryRange: document.querySelector("[data-role=category-range]"),

    alertPrimary: document.querySelector("[data-role=alert-primary]"),
    alertSecondary: document.querySelector("[data-role=alert-secondary]"),
    alertTertiary: document.querySelector("[data-role=alert-tertiary]"),
    recentActivity: document.querySelector("[data-role=recent-activity]"),

    goalList: document.querySelector("[data-role=goal-list]"),
    budgetList: document.querySelector("[data-role=budget-list]"),
    budgetRange: document.querySelector("[data-role=budget-range]"),

    upcomingList: document.querySelector("[data-role=upcoming-list]")
};

function setText(el, value) {
    if (!el) return;
    el.textContent = value;
}

function formatCurrency(value) {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) return "--";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(num);
}

function formatSignedCurrency(value, type) {
    if (value == null) return "--";
    const amount = Number(value) || 0;
    const isExpense = type ? type === "EXPENSE" : amount < 0;
    const prefix = isExpense ? "- " : "+ ";
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = `${d.getDate()}`.padStart(2, "0");
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    return `${day}/${month}/${d.getFullYear()}`;
}

function initialsFromName(name, fallback = "--") {
    if (!name) return fallback;
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return fallback;
    const first = parts[0][0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return `${first}${last}`.toUpperCase();
}

async function hydrateUser() {
    const username = getUser();
    if (!username) {
        setText(els.userName, "Khách");
        setText(els.userEmail, "Vui lòng đăng nhập");
        setText(els.userAvatar, "--");
        return null;
    }

    try {
        const res = await getUserByUsername(username);
        if (!res.ok || !res.data) {
            setText(els.userName, username);
            setText(els.userEmail, "Không tải được email");
            setText(els.userAvatar, initialsFromName(username));
            return null;
        }
        const user = res.data;
        state.userId = user.id;
        setText(els.userName, user.fullName || user.username || "Người dùng");
        setText(els.userEmail, user.email || "");
        setText(els.userAvatar, initialsFromName(user.fullName || user.username, "--"));
        return user.id;
    } catch (err) {
        setText(els.userName, username);
        setText(els.userEmail, "Không thể kết nối máy chủ");
        setText(els.userAvatar, initialsFromName(username));
        return null;
    }
}

async function loadSummary() {
    if (!state.userId) return;
    const res = await fetchSummary(state.userId, "MONTH");
    if (!res.ok) {
        setText(els.reportRange, "Kỳ báo cáo: không khả dụng");
        setText(els.reportUpdated, res.message || "Không tải được thống kê");
        renderCategories();
        return;
    }
    state.summary = res.data || {};
    renderSummary();
    renderCategories();
}

async function loadTransactions() {
    if (!state.userId) return;
    try {
        const data = await fetchTransactions(state.userId);
        state.transactions = Array.isArray(data) ? data : [];
    } catch (err) {
        state.transactions = [];
    }
    renderTransactionDerived();
}

async function loadBudgets() {
    if (!state.userId) return;
    const res = await fetchBudgets(state.userId);
    if (res?.ok && Array.isArray(res.data)) {
        state.budgets = res.data;
    } else {
        state.budgets = [];
    }
    renderGoals();
}

async function loadBudgetStatus() {
    if (!state.userId) return;
    const res = await fetchBudgetStatus(state.userId, "MONTH");
    if (res?.ok) {
        state.budgetStatus = res.data;
    } else {
        state.budgetStatus = null;
    }
    renderBudgetStatus();
}

function renderSummary() {
    const data = state.summary || {};
    const totalIncome = Number(data.totalIncome || 0);
    const totalExpense = Number(data.totalExpense || 0);
    const netBalance = data.netBalance != null ? Number(data.netBalance) : totalIncome - totalExpense;

    setText(els.netBalance, formatCurrency(netBalance));
    setText(els.totalIncome, formatCurrency(totalIncome));
    setText(els.totalExpense, formatCurrency(totalExpense));
    setText(els.transactionCount, state.transactions.length || "0");
    setText(els.netNote, `Khoảng thời gian ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`);

    setText(els.reportRange, `Kỳ báo cáo: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`);
    setText(els.reportUpdated, `Cập nhật lúc ${formatDate(new Date().toISOString())}`);

    setText(els.kpiIncome, formatCurrency(totalIncome));
    setText(els.kpiExpense, formatCurrency(totalExpense));

    const savingRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
    setText(els.savingRate, `${savingRate}%`);

    const incomeExpenseTotal = Math.max(totalIncome + totalExpense, 1);
    setBarWidth(els.incomeBar, (totalIncome / incomeExpenseTotal) * 100);
    setBarWidth(els.expenseBar, (totalExpense / incomeExpenseTotal) * 100);
    setBarWidth(els.savingBar, savingRate);

    const recentCount = Math.min(5, state.transactions.length);
    setText(els.recentCount, `${recentCount} giao dịch`);
    setBarWidth(els.recentBar, Math.min(100, (recentCount / 5) * 100));

    updateDelta(els.incomeChange, data.incomeChangePercent);
    updateDelta(els.expenseChange, data.expenseChangePercent, true);
    updateDelta(els.savingDelta, data.savingChangePercent);
    updateDelta(els.recentChange, data.transactionChangePercent);
}

function setBarWidth(el, percent) {
    if (!el) return;
    const safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
    el.style.width = `${safePercent}%`;
}

function updateDelta(el, delta, isNegativeBetter = false) {
    if (!el) return;
    if (delta == null || Number.isNaN(Number(delta))) {
        el.textContent = "--";
        return;
    }
    const value = Number(delta);
    const isPositive = value >= 0;
    const positiveFlag = isPositive !== isNegativeBetter;
    el.textContent = `${isPositive ? "+" : ""}${value.toFixed(1)}%`;
    el.classList.toggle("delta--positive", positiveFlag);
    el.classList.toggle("delta--negative", !positiveFlag);
}

function renderTransactionDerived() {
    setText(els.transactionCount, state.transactions.length || "0");
    renderCashflowChart();
    renderLegend();
    renderActivities();
    renderUpcoming();
}

function buildMonthlySeries() {
    const series = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
        series.push({ key, label: `${`${d.getMonth() + 1}`.padStart(2, "0")}/${d.getFullYear() % 100}`, income: 0, expense: 0 });
    }

    state.transactions.forEach(t => {
        if (!t.transactionDate || !t.type) return;
        const key = (t.transactionDate || "").slice(0, 7);
        const entry = series.find(item => item.key === key);
        if (!entry) return;
        const amount = Number(t.amount || 0);
        if (t.type === "INCOME") {
            entry.income += amount;
        } else if (t.type === "EXPENSE") {
            entry.expense += amount;
        }
    });

    return series;
}

function renderCashflowChart() {
    if (!els.cashflowChart) return;
    const series = buildMonthlySeries();
    const hasData = series.some(item => item.income > 0 || item.expense > 0);
    els.cashflowChart.innerHTML = "";

    if (!hasData) {
        els.cashflowChart.innerHTML = "<p class='chart-subtitle'>Chưa có dữ liệu giao dịch để vẽ biểu đồ.</p>";
        return;
    }

    const width = 620;
    const height = 240;
    const padding = 20;
    const maxVal = Math.max(
        ...series.map(s => Math.max(s.income, s.expense)),
        1
    );

    const point = (value, idx, length) => {
        const x = (idx / Math.max(1, length - 1)) * (width - padding * 2) + padding;
        const y = height - padding - (value / maxVal) * (height - padding * 2);
        return `${x},${y}`;
    };

    const incomePoints = series.map((s, idx, arr) => point(s.income, idx, arr.length)).join(" ");
    const expensePoints = series.map((s, idx, arr) => point(s.expense, idx, arr.length)).join(" ");
    const incomeFill = `${incomePoints} ${width - padding},${height - padding} ${padding},${height - padding}`;
    const expenseFill = `${expensePoints} ${width - padding},${height - padding} ${padding},${height - padding}`;

    const labels = series.map((s, idx, arr) => {
        const x = (idx / Math.max(1, arr.length - 1)) * (width - padding * 2) + padding;
        return `<text x="${x}" y="${height - 4}" text-anchor="middle" class="chart-x-label">${s.label}</text>`;
    }).join("");

    els.cashflowChart.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <polyline fill="rgba(34, 197, 94, 0.12)" stroke="rgba(34, 197, 94, 0)" stroke-width="0" points="${incomeFill}" />
            <polyline fill="rgba(249, 115, 22, 0.12)" stroke="rgba(249, 115, 22, 0)" stroke-width="0" points="${expenseFill}" />
            <polyline fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" points="${incomePoints}" />
            <polyline fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round" points="${expensePoints}" />
            ${labels}
        </svg>
    `;
}

function renderLegend() {
    if (!els.avgIncome || !els.avgExpense || !els.avgSurplus) return;
    const series = buildMonthlySeries();
    const monthsWithData = series.filter(s => s.income || s.expense);
    const divisor = monthsWithData.length || 1;
    const totalIncome = monthsWithData.reduce((sum, s) => sum + s.income, 0);
    const totalExpense = monthsWithData.reduce((sum, s) => sum + s.expense, 0);
    const avgIncome = totalIncome / divisor;
    const avgExpense = totalExpense / divisor;
    const avgSurplus = avgIncome - avgExpense;

    setText(els.avgIncome, `${formatCurrency(avgIncome)} / tháng`);
    setText(els.avgExpense, `${formatCurrency(avgExpense)} / tháng`);
    setText(els.avgSurplus, `${formatSignedCurrency(avgSurplus)} (${divisor} tháng)`);
    setText(els.cashflowRange, `${divisor} tháng gần nhất`);
}

function renderCategories() {
    if (!els.categoryChart) return;
    const categories = state.summary?.expenseByCategory;

    let dataset = Array.isArray(categories) ? categories.slice() : [];
    if (!dataset.length) {
        dataset = aggregateCategoriesFromTransactions();
    }

    els.categoryChart.innerHTML = "";
    if (!dataset.length) {
        els.categoryChart.innerHTML = "<p class='chart-subtitle'>Chưa có dữ liệu chi tiêu theo danh mục.</p>";
        setText(els.categoryNote, "Hãy thêm giao dịch để thấy cơ cấu chi tiêu.");
        return;
    }

    const max = Math.max(...dataset.map(c => Number(c.expense || c.amount || 0)), 1);
    dataset
        .sort((a, b) => Number(b.expense || b.amount || 0) - Number(a.expense || a.amount || 0))
        .slice(0, 5)
        .forEach((cat, idx) => {
            const amount = Number(cat.expense || cat.amount || 0);
            const percent = Math.round((amount / max) * 100);
            const row = document.createElement("div");
            row.className = "bar-row";
            const barClass = ["", "bar-fill--teal", "bar-fill--orange", "bar-fill--purple"][idx % 4] || "";
            row.innerHTML = `
                <div class="bar-label">
                    <span>${cat.category || cat.name || "Khác"}</span>
                    <strong>${formatCurrency(amount)}</strong>
                </div>
                <div class="bar-track"><div class="bar-fill ${barClass}" style="width:${percent}%"></div></div>
            `;
            els.categoryChart.appendChild(row);
        });

    setText(els.categoryNote, `${dataset.length} danh mục đã được thống kê từ dữ liệu thực.`);
    setText(els.categoryRange, state.summary?.endDate ? `Kết thúc: ${formatDate(state.summary.endDate)}` : "Tháng này");
}

function aggregateCategoriesFromTransactions() {
    const map = new Map();
    state.transactions.forEach(t => {
        if (t.type !== "EXPENSE") return;
        const key = t.category || "Khác";
        const current = map.get(key) || 0;
        map.set(key, current + Number(t.amount || 0));
    });
    return Array.from(map.entries()).map(([category, amount]) => ({ category, expense: amount }));
}

function renderActivities() {
    if (!els.recentActivity) return;
    els.recentActivity.innerHTML = "";

    if (!state.transactions.length) {
        els.recentActivity.innerHTML = "<p class='chart-subtitle'>Chưa có giao dịch gần đây.</p>";
        return;
    }

    const sorted = state.transactions.slice().sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || ""));
    sorted.slice(0, 4).forEach(t => {
        const item = document.createElement("div");
        item.className = "activity-item";
        item.innerHTML = `
            <span>${t.description || "(Không mô tả)"}</span>
            <span class="activity-amount">${formatSignedCurrency(t.amount, t.type)}</span>
        `;
        els.recentActivity.appendChild(item);
    });

    updateAlerts(sorted);
}

function renderUpcoming() {
    if (!els.upcomingList) return;
    els.upcomingList.innerHTML = "";
    if (!state.transactions.length) {
        els.upcomingList.innerHTML = "<div class='table-row'><div><strong>Không có giao dịch</strong><span>Vui lòng thêm mới.</span></div></div>";
        return;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = state.transactions
        .filter(t => {
            if (!t.transactionDate) return false;
            const d = new Date(t.transactionDate);
            d.setHours(0, 0, 0, 0);
            return !Number.isNaN(d.getTime()) && d >= now;
        })
        .sort((a, b) => (a.transactionDate || "").localeCompare(b.transactionDate || ""))
        .slice(0, 4);

    if (!upcoming.length) {
        els.upcomingList.innerHTML = "<div class='table-row'><div><strong>Chưa có giao dịch sắp tới</strong><span>Những giao dịch tương lai sẽ hiển thị tại đây.</span></div></div>";
        return;
    }

    upcoming.forEach(t => {
        const row = document.createElement("div");
        row.className = "table-row";
        const pillClass = t.type === "INCOME" ? "pill--positive" : "pill--warning";
        row.innerHTML = `
            <div>
                <strong>${t.description || "(Không mô tả)"}</strong>
                <span>${formatDate(t.transactionDate)}</span>
            </div>
            <div class="pill ${pillClass}">${formatSignedCurrency(t.amount, t.type)}</div>
        `;
        els.upcomingList.appendChild(row);
    });
}

function updateAlerts(sortedTransactions) {
    if (!els.alertPrimary || !els.alertSecondary || !els.alertTertiary) return;

    const data = state.summary || {};
    const overSpend = data.netBalance != null && data.netBalance < 0;
    const spendingWarn = overSpend ? "Chi tiêu đang vượt thu nhập, hãy rà soát ngân sách." : "Dòng tiền ròng đang an toàn.";
    setText(els.alertPrimary, spendingWarn);

    if (state.budgetStatus?.overBudget) {
        setText(els.alertSecondary, "Cảnh báo: Ngân sách đã vượt giới hạn cho kỳ này.");
        els.alertSecondary.classList.remove("alert-panel--safe");
    } else if (state.budgetStatus?.unsafeBalance) {
        setText(els.alertSecondary, "Số dư ròng thấp hơn mức an toàn bạn đặt.");
        els.alertSecondary.classList.remove("alert-panel--safe");
    } else if (state.budgetStatus) {
        setText(els.alertSecondary, "Ngân sách trong giới hạn an toàn.");
        els.alertSecondary.classList.add("alert-panel--safe");
    } else {
        setText(els.alertSecondary, "Chưa có dữ liệu ngân sách.");
        els.alertSecondary.classList.remove("alert-panel--safe");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = sortedTransactions.filter(t => {
        if (!t.transactionDate) return false;
        const d = new Date(t.transactionDate);
        d.setHours(0, 0, 0, 0);
        return d >= today;
    });
    setText(els.alertTertiary, upcoming.length ? `${upcoming.length} giao dịch sẽ diễn ra trong kỳ tiếp theo.` : "Không có giao dịch sắp tới.");
}

function renderGoals() {
    if (!els.goalList) return;
    els.goalList.innerHTML = "";

    if (!state.budgets.length) {
        els.goalList.innerHTML = "<p class='chart-subtitle'>Chưa có mục tiêu tiết kiệm hoặc ngân sách.</p>";
        return;
    }

    state.budgets.slice(0, 3).forEach(budget => {
        const amount = Number(budget.amount || budget.targetAmount || 0);
        const saved = Number(budget.saved || budget.currentAmount || 0);
        const percent = amount > 0 ? Math.min(100, Math.round((saved / amount) * 100)) : 0;
        const period = budget.period ? budget.period.toUpperCase() : "--";
        const goal = document.createElement("div");
        goal.className = "goal-item";
        goal.innerHTML = `
            <div>
                <strong>${budget.name || budget.title || `Ngân sách ${period}`}</strong>
                <p>${formatCurrency(saved)} / ${formatCurrency(amount || budget.amount || 0)}</p>
            </div>
            <div class="progress-bar"><div class="progress-value" style="width:${percent}%"></div></div>
            <div class="progress-meta">
                <span>Tiến độ</span>
                <strong>${percent}%</strong>
            </div>
        `;
        els.goalList.appendChild(goal);
    });
}

function renderBudgetStatus() {
    if (!els.budgetList) return;
    els.budgetList.innerHTML = "";
    if (!state.budgetStatus) {
        els.budgetList.innerHTML = "<p class='chart-subtitle'>Chưa có dữ liệu ngân sách kỳ này.</p>";
        return;
    }

    const status = state.budgetStatus;
    const total = (status.remaining ?? 0) + (status.spent ?? 0);
    const usagePercent = total > 0 ? Math.min(100, Math.round(((status.spent ?? 0) / total) * 100)) : 0;

    setText(els.budgetRange, `${formatDate(status.startDate)} - ${formatDate(status.endDate)}`);

    const rows = [
        {
            title: "Đã chi",
            detail: `${formatCurrency(status.spent)} / ${formatCurrency(total || status.spent || 0)}`,
            variant: usagePercent > 85 ? "warning" : "positive",
            percent: usagePercent
        },
        {
            title: "Còn lại",
            detail: formatCurrency(status.remaining ?? 0),
            variant: (status.remaining ?? 0) > 0 ? "positive" : "warning",
            percent: total ? Math.round(((status.remaining ?? 0) / total) * 100) : 0
        },
        {
            title: "Số dư ròng",
            detail: formatSignedCurrency(status.netBalance ?? 0, (status.netBalance ?? 0) >= 0 ? "INCOME" : "EXPENSE"),
            variant: (status.netBalance ?? 0) >= 0 ? "positive" : "warning",
            percent: Math.min(100, Math.abs(Math.round((status.netBalance ?? 0) / (total || 1) * 100)))
        }
    ];

    rows.forEach(row => {
        const el = document.createElement("div");
        el.className = "budget-item";
        el.innerHTML = `
            <div>
                <strong>${row.title}</strong>
                <p>${row.detail}</p>
            </div>
            <div class="pill pill--${row.variant}">${row.percent}%</div>
        `;
        els.budgetList.appendChild(el);
    });

    if (state.transactions.length) {
        const sorted = state.transactions.slice().sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || ""));
        updateAlerts(sorted);
    }
}

async function init() {
    const userId = await hydrateUser();
    if (!userId) return;

    await Promise.all([loadSummary(), loadTransactions(), loadBudgets(), loadBudgetStatus()]);
}

document.addEventListener("DOMContentLoaded", init);