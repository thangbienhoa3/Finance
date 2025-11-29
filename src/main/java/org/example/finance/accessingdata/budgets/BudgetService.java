package org.example.finance.accessingdata.budgets;

import org.example.finance.accessingdata.transactions.TransactionRepository;
import org.example.finance.accessingdata.transactions.TransactionType;
import org.example.finance.accessingdata.user.User;
import org.example.finance.accessingdata.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, UserRepository userRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    public Budget saveBudget(BudgetRequest request) {
        if (request.userId() == null || request.period() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin người dùng hoặc chu kỳ ngân sách");
        }
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng: " + request.userId()));

        Budget budget = budgetRepository.findByUserIdAndPeriod(user.getId(), request.period())
                .orElseGet(Budget::new);

        budget.setUser(user);
        budget.setPeriod(request.period());
        budget.setAmount(defaultAmount(request.amount()));
        budget.setSafeBalance(request.safeBalance());

        return budgetRepository.save(budget);
    }

    @Transactional(readOnly = true)
    public List<Budget> findBudgetsForUser(Long userId) {
        return budgetRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public BudgetStatusResponse evaluate(Long userId, BudgetPeriod period) {
        Budget budget = budgetRepository.findByUserIdAndPeriod(userId, period)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa cấu hình ngân sách cho kỳ này"));

        RangeWindow window = resolveWindow(period);
        BigDecimal spent = defaultAmount(transactionRepository.sumAmountByUserAndTypeAndDateBetween(userId, TransactionType.EXPENSE, window.start(), window.end()));
        BigDecimal income = defaultAmount(transactionRepository.sumAmountByUserAndTypeAndDateBetween(userId, TransactionType.INCOME, window.start(), window.end()));
        BigDecimal remaining = budget.getAmount().subtract(spent);
        BigDecimal netBalance = income.subtract(spent);

        boolean overBudget = spent.compareTo(budget.getAmount()) > 0;
        boolean unsafe = budget.getSafeBalance() != null && netBalance.compareTo(budget.getSafeBalance()) < 0;

        return new BudgetStatusResponse(
                budget.getId(),
                userId,
                period,
                window.start(),
                window.end(),
                budget.getAmount(),
                spent,
                income,
                netBalance,
                remaining,
                overBudget,
                unsafe
        );
    }

    private RangeWindow resolveWindow(BudgetPeriod period) {
        LocalDate today = LocalDate.now();
        return switch (period) {
            case WEEK -> new RangeWindow(today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
                    today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)));
            case MONTH -> new RangeWindow(today.with(TemporalAdjusters.firstDayOfMonth()),
                    today.with(TemporalAdjusters.lastDayOfMonth()));
        };
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private record RangeWindow(LocalDate start, LocalDate end) { }
}
