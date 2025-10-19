package org.example.finance.accessingdata.transactions;

import org.springframework.transaction.annotation.Transactional;
import org.example.finance.accessingdata.user.User;
import org.example.finance.accessingdata.user.UserRepository;
import org.example.finance.accessingdata.user.UserService;
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
       User user = userRepository.findById(request.userId()).orElseThrow(() ->
               new IllegalArgumentException("User not found with id: " + request.userId()));

       Transaction transaction = new Transaction();

       transaction.setUser(user);
       transaction.setAmount(request.amount());
       transaction.setDescription(request.description());
       transaction.setCategory(request.category());
       transaction.setTransactionDate(request.transactionDate());

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
}
