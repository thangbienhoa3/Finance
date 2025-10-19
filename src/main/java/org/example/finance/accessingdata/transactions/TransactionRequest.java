package org.example.finance.accessingdata.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        Long userId,
        TransactionType type,
        BigDecimal amount,
        String category,
        String description,
        LocalDate transactionDate
) {
}
