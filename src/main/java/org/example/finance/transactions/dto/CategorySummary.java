package org.example.finance.transactions.dto;

import java.math.BigDecimal;

public record CategorySummary(
        String category, BigDecimal expense
) {
}
