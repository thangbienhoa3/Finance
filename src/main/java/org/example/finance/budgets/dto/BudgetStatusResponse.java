package org.example.finance.budgets.dto;

import org.example.finance.budgets.model.BudgetPeriod;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetStatusResponse(
        Long budgetId,
        Long userId,
        BudgetPeriod period,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal limitAmount,
        BigDecimal spent,
        BigDecimal income,
        BigDecimal netBalance,
        BigDecimal remaining,
        boolean overBudget,
        boolean unsafeBalance
) {
}
