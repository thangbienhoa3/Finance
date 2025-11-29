package org.example.finance.accessingdata.budgets;

import java.math.BigDecimal;

public record BudgetRequest(
        Long userId,
        BudgetPeriod period,
        BigDecimal amount,
        BigDecimal safeBalance
) {
}
