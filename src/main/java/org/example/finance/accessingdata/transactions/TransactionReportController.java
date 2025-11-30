package org.example.finance.accessingdata.transactions;


import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions/report")
@CrossOrigin(origins = "http://localhost:8080")
public class TransactionReportController {

    private final TransactionAnalyticsService analyticsService;

    public TransactionReportController(TransactionAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public TransactionSummaryResponse summarize(@RequestParam Long userId,
                                                @RequestParam(defaultValue = "MONTH") ReportRange range) {
        return analyticsService.summarize(userId, range);
    }
}
