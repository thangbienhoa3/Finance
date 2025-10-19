package org.example.finance.accessingdata.transactions;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:8080")

public class TransactionController {
    @Autowired
    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }
    @GetMapping
    public List<Transaction> getAll() {
        return service.getAllTransactions();
    }

    @PostMapping
    public ResponseEntity<Transaction> create(@RequestBody TransactionRequest request) {
        Transaction created = service.createTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    @PutMapping("/{id}")
    public Transaction update(@PathVariable Long id, @RequestBody TransactionRequest request) {
        return service.updateTransaction(id, request);
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteTransaction(id);
    }
}
