package org.example.finance.accessingdata.transactions.dto;

import java.math.BigDecimal;

public record CategorySummary(
        String category, BigDecimal expense
) {
}
