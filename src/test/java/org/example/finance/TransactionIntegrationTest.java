package org.example.finance;

import org.example.finance.accessingdata.transactions.*;
import org.example.finance.accessingdata.user.User;
import org.example.finance.accessingdata.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TransactionService transactionService;

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
        int userCount = 1000;
        int transactionsPerUser = 5;
        int totalTransactions = userCount * transactionsPerUser;
        LocalDate transactionDate = LocalDate.now();

        List<User> users = IntStream.range(0, userCount)
                .mapToObj(i -> {
                    User user = new User();
                    user.setUsername("concurrent-user-" + i);
                    user.setEmail("concurrent-user-" + i + "@example.com");
                    user.setPassword("password");
                    return userRepository.save(user);
                })
                .collect(Collectors.toList());

        List<TransactionJob> jobs = users.stream()
                .flatMap(user -> IntStream.range(0, transactionsPerUser)
                        .mapToObj(attempt -> new TransactionJob(user, attempt)))
                .toList();

        ExecutorService executor = Executors.newFixedThreadPool(totalTransactions);
        CountDownLatch readyLatch = new CountDownLatch(totalTransactions);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalTransactions);
        AtomicInteger failureCount = new AtomicInteger();

        try {
            jobs.forEach(job -> executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    TransactionRequest request = new TransactionRequest(
                            job.user().getId(),
                            TransactionType.INCOME,
                            BigDecimal.valueOf(job.sequence() + 1),
                            "Salary",
                            "batch-" + job.user().getUsername() + '-' + job.sequence(),
                            transactionDate
                    );
                    transactionService.createTransaction(request);
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            }));

            assertTrue(readyLatch.await(30, TimeUnit.SECONDS), "All tasks should be ready before starting");
            startLatch.countDown();
            boolean finished = doneLatch.await(60, TimeUnit.SECONDS);

            assertTrue(finished, "Not all tasks completed in time");
            assertThat(failureCount.get()).isZero();
        } finally {
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(60, TimeUnit.SECONDS), "Executor did not terminate in time");
        }

        List<Transaction> savedTransactions = transactionRepository.findAll();
        assertThat(savedTransactions).hasSize(totalTransactions);
        assertThat(savedTransactions)
                .allSatisfy(transaction -> {
                    assertThat(transaction.getType()).isEqualTo(TransactionType.INCOME);
                    assertThat(transaction.getCategory()).isEqualTo("Salary");
                    assertThat(transaction.getTransactionDate()).isEqualTo(transactionDate);
                });

        Map<Long, Long> transactionsPerUserResult = savedTransactions.stream()
                .collect(Collectors.groupingBy(transaction -> transaction.getUser().getId(), Collectors.counting()));
        Map<Long, Long> expectedCounts = jobs.stream()
                .collect(Collectors.groupingBy(job -> job.user().getId(), Collectors.counting()));

        assertThat(transactionsPerUserResult)
                .as("Every user should have the expected number of transactions")
                .containsExactlyInAnyOrderEntriesOf(expectedCounts);
    }

    private record TransactionJob(User user, int sequence) {
    }
}
