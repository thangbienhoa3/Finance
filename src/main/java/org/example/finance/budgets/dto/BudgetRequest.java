package org.example.finance.budgets.dto;

import org.example.finance.budgets.model.BudgetPeriod;

import java.math.BigDecimal;

public record BudgetRequest(
        Long userId,
        BudgetPeriod period,
        BigDecimal amount,
        BigDecimal safeBalance
) {
}
