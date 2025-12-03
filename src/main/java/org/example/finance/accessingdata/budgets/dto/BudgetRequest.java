package org.example.finance.accessingdata.budgets.dto;

import org.example.finance.accessingdata.budgets.model.BudgetPeriod;

import java.math.BigDecimal;

public record BudgetRequest(
        Long userId,
        BudgetPeriod period,
        BigDecimal amount,
        BigDecimal safeBalance
) {
}
