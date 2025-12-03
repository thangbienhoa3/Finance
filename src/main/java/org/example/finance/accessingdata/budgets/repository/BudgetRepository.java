package org.example.finance.accessingdata.budgets.repository;

import org.example.finance.accessingdata.budgets.model.Budget;
import org.example.finance.accessingdata.budgets.model.BudgetPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserId(Long userId);

    Optional<Budget> findByUserIdAndPeriod(Long userId, BudgetPeriod period);
}
