package org.example.finance.accessingdata.budgets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/budgets")
@CrossOrigin(origins = "http://localhost:8080")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<Budget> createOrUpdate(@RequestBody BudgetRequest request) {
        Budget saved = budgetService.saveBudget(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{userId}")
    public List<Budget> list(@PathVariable Long userId) {
        return budgetService.findBudgetsForUser(userId);
    }

    @GetMapping("/{userId}/status")
    public BudgetStatusResponse evaluate(@PathVariable Long userId, @RequestParam BudgetPeriod period) {
        return budgetService.evaluate(userId, period);
    }

}
