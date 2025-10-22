package org.example.finance;

import org.example.finance.accessingdata.transactions.*;
import org.example.finance.accessingdata.user.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // ✅ enables @Mock and @InjectMocks
class TransactionServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private TransactionService transactionService; // real instance with mocked dependencies

    @Test
    void createTransactionPersistsAllFieldsCorrectly() {
        // Arrange: giả lập user
        User user = new User();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Giả lập hành vi lưu Transaction
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> {
                    Transaction t = invocation.getArgument(0);
                    t.setId(10L);  // giả lập DB tự sinh id
                    return t;
                });

        // Request giống dữ liệu từ client
        TransactionRequest request = new TransactionRequest(
                1L,
                TransactionType.EXPENSE,
                new BigDecimal("15.25"),
                "Food",
                "Lunch",
                LocalDate.of(2024, 1, 10)
        );

        // Act: gọi phương thức service
        Transaction created = transactionService.createTransaction(request);
        // Assert 1: xác nhận hàm save() được gọi đúng 1 lần
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(1)).save(captor.capture());
        Transaction persisted = captor.getValue();

        // Assert 2: kiểm tra các giá trị trong đối tượng được lưu
        assertThat(persisted.getUser()).isSameAs(user);
        assertThat(persisted.getType()).isEqualTo(TransactionType.EXPENSE);
        assertThat(persisted.getAmount()).isEqualByComparingTo("15.25");
        assertThat(persisted.getCategory()).isEqualTo("Food");
        assertThat(persisted.getDescription()).isEqualTo("Lunch");
        assertThat(persisted.getTransactionDate()).isEqualTo(LocalDate.of(2024, 1, 10));

        // Assert 3: kiểm tra đối tượng trả về từ service
        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getAmount()).isEqualByComparingTo("15.25");
        assertThat(created.getCategory()).isEqualTo("Food");
        assertThat(created.getDescription()).isEqualTo("Lunch");
        assertThat(created.getType()).isEqualTo(TransactionType.EXPENSE);
    }
}
