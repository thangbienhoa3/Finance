package org.example.finance.accessingdata.transactions.controller;


import org.example.finance.accessingdata.transactions.model.Transaction;
import org.example.finance.accessingdata.transactions.dto.TransactionRequest;
import org.example.finance.accessingdata.transactions.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/{userId}")
    public List<Transaction> getAll(@PathVariable Long userId) {
        System.out.println(userId);
        return service.getTransactionByUserId(userId);
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
