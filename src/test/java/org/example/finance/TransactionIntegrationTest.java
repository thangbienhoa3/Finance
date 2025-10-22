package org.example.finance;

import org.example.finance.accessingdata.transactions.*;
import org.example.finance.accessingdata.user.User;
import org.example.finance.accessingdata.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")

class TransactionIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("TransactionService should remain consistent under high concurrency")
    void createTransactionShouldBeThreadSafe() throws InterruptedException {
        int userCount = 8;
        int transactionsPerUser = 25;
        int totalTransactions = userCount * transactionsPerUser;

        List<User> users = IntStream.range(0, userCount)
                .mapToObj(i -> {
                    User user = new User();
                    user.setUsername("concurrent-user-" + i);
                    user.setEmail("concurrent-user-" + i + "@example.com");
                    user.setPassword("password");
                    return userRepository.save(user);
                })
                .toList();

        ExecutorService executor = Executors.newFixedThreadPool(Math.min(32, totalTransactions));
        CountDownLatch readyLatch = new CountDownLatch(totalTransactions);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalTransactions);
        AtomicInteger failureCount = new AtomicInteger();

        for (User user : users) {
            for (int txIndex = 0; txIndex < transactionsPerUser; txIndex++) {
                final int attempt = txIndex;
                executor.submit(() -> {
                    readyLatch.countDown();
                    try {
                        startLatch.await();
                        TransactionRequest request = new TransactionRequest(
                                user.getId(),
                                TransactionType.INCOME,
                                BigDecimal.valueOf(attempt + 1),
                                "Salary",
                                "batch-" + user.getUsername() + '-' + attempt,
                                LocalDate.now()
                        );
                        transactionService.createTransaction(request);
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }
        }

        assertTrue(readyLatch.await(30, TimeUnit.SECONDS), "All tasks should be ready before starting");
        startLatch.countDown();
        boolean finished = doneLatch.await(60, TimeUnit.SECONDS);

        executor.shutdown();
        assertTrue(executor.awaitTermination(60, TimeUnit.SECONDS), "Executor did not terminate in time");
        assertTrue(finished, "Not all tasks completed in time");
        assertThat(failureCount.get()).isZero();

        List<Transaction> savedTransactions = transactionRepository.findAll();
        assertThat(savedTransactions).hasSize(totalTransactions);

        Map<Long, Long> transactionsPerUserResult = savedTransactions.stream()
                .collect(Collectors.groupingBy(transaction -> transaction.getUser().getId(), Collectors.counting()));

        users.forEach(user -> assertThat(transactionsPerUserResult.get(user.getId()))
                .as("User %s should have %s transactions", user.getId(), transactionsPerUser)
                .isEqualTo((long) transactionsPerUser));
    }
}
