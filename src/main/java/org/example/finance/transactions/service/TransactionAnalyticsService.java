package org.example.finance.transactions.service;
import org.example.finance.transactions.dto.CategorySummary;
import org.example.finance.transactions.dto.ReportRange;
import org.example.finance.transactions.dto.TransactionSummaryResponse;
import org.example.finance.transactions.model.TransactionType;
import org.example.finance.transactions.repository.TransactionRepository;
import org.example.finance.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TransactionAnalyticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionAnalyticsService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    public TransactionSummaryResponse summarize(Long userId, ReportRange range) {
        validateUser(userId);

        DateWindow window = resolveWindow(range);
        BigDecimal totalIncome = defaultAmount(transactionRepository
                .sumAmountByUserAndTypeAndDateBetween(userId, TransactionType.INCOME, window.start(), window.end()));
        BigDecimal totalExpense = defaultAmount(transactionRepository
                .sumAmountByUserAndTypeAndDateBetween(userId, TransactionType.EXPENSE, window.start(), window.end()));

        List<CategorySummary> categories = transactionRepository
                .sumByCategoryAndTypeBetweenDates(userId, TransactionType.EXPENSE, window.start(), window.end())
                .stream()
                .map(row -> new CategorySummary(
                        row[0] == null ? "Khác" : String.valueOf(row[0]),
                        defaultAmount((BigDecimal) row[1])
                ))
                .collect(Collectors.toList());

        return new TransactionSummaryResponse(
                range,
                window.start(),
                window.end(),
                totalIncome,
                totalExpense,
                totalIncome.subtract(totalExpense),
                categories
        );
    }

    private void validateUser(Long userId) {
        userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng: " + userId));
    }

    private DateWindow resolveWindow(ReportRange range) {
        LocalDate today = LocalDate.now();
        return switch (range) {
            case WEEK -> new DateWindow(today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
                    today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)));
            case MONTH -> new DateWindow(today.with(TemporalAdjusters.firstDayOfMonth()),
                    today.with(TemporalAdjusters.lastDayOfMonth()));
            case YEAR -> new DateWindow(today.with(TemporalAdjusters.firstDayOfYear()),
                    today.with(TemporalAdjusters.lastDayOfYear()));
        };
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private record DateWindow(LocalDate start, LocalDate end) { }
}