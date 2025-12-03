package org.example.finance.accessingdata.transactions.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TransactionSummaryResponse(
        ReportRange range,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal netBalance,
        List<CategorySummary> expenseByCategory
) {
}
