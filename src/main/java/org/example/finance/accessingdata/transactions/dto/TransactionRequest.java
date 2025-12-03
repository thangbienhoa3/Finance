package org.example.finance.accessingdata.transactions.dto;

import org.example.finance.accessingdata.transactions.model.TransactionType;

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
