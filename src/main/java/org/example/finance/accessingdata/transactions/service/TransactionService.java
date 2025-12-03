package org.example.finance.accessingdata.transactions.service;

import org.example.finance.accessingdata.transactions.model.Transaction;
import org.example.finance.accessingdata.transactions.repository.TransactionRepository;
import org.example.finance.accessingdata.transactions.dto.TransactionRequest;
import org.example.finance.accessingdata.transactions.model.TransactionType;
import org.springframework.transaction.annotation.Transactional;
import org.example.finance.accessingdata.user.model.User;
import org.example.finance.accessingdata.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class TransactionService {
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public TransactionService(UserRepository userRepository,  TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    public Transaction createTransaction(TransactionRequest request) {
        User user = getUserOrThrow(request.userId());
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setCategory(request.category());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(defaultDate(request.transactionDate()));
        return transactionRepository.save(transaction);
    }

    public Transaction updateTransaction(Long id, TransactionRequest request) {
        Transaction transaction = getTransactionOrThrow(id);
        if (request.userId() != null && (transaction.getUser() == null || !transaction.getUser().getId().equals(request.userId()) )) {
            transaction.setUser(getUserOrThrow(request.userId()));
        }
        if (request.type() != null) {transaction.setType(request.type());}
        if (request.amount() != null) {transaction.setAmount(request.amount());}
        if (request.category() != null) {transaction.setCategory(request.category());}
        if (request.description() != null) {transaction.setDescription(request.description());}
        if (request.transactionDate() != null) {transaction.setTransactionDate(request.transactionDate());}

        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(Long id) {
        Transaction transaction = getTransactionOrThrow(id);
        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Transaction getTransaction(Long id) {
        return getTransactionOrThrow(id);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsForUserAndType(Long userId, TransactionType type) {
        return transactionRepository.findByUserIdAndType(userId, type);
    }


    public Transaction getTransactionOrThrow(Long id) {
        return transactionRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id));
    }

    private User getUserOrThrow(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is required for a transaction");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private LocalDate defaultDate(LocalDate date) {
        return date == null ? LocalDate.now() : date;
    }

    public List<Transaction> getTransactionByUserId(Long userId) {
        return  transactionRepository.findByUserId(userId);
    }
}
