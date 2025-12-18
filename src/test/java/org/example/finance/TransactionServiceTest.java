package org.example.finance;

import org.example.finance.transactions.dto.TransactionRequest;
import org.example.finance.transactions.model.Transaction;
import org.example.finance.transactions.model.TransactionType;
import org.example.finance.transactions.repository.TransactionRepository;
import org.example.finance.transactions.service.TransactionService;
import org.example.finance.user.model.User;
import org.example.finance.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
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
        System.out.println(created.toString());
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

    @Test
    void deleteTransactionRemovesEntityAfterLookup() {
        // Arrange: tìm thấy transaction trong repo
        Transaction stored = new Transaction();
        stored.setId(200L);
        when(transactionRepository.findById(200L)).thenReturn(Optional.of(stored));

        // Act: xóa
        transactionService.deleteTransaction(200L);

        // Assert: phải gọi delete với object đã lấy ra
        verify(transactionRepository).delete(stored);
    }

    @Test
    void updateTransactionReassignsUserWhenDifferentId() {
        // Arrange: transaction hiện tại thuộc user A
        User currentUser = new User();
        currentUser.setId(1L);
        Transaction stored = new Transaction();
        stored.setId(15L);
        stored.setUser(currentUser);
        // User mới chuẩn bị trước
        User newUser = new User();
        newUser.setId(2L);

        when(transactionRepository.findById(15L)).thenReturn(Optional.of(stored));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newUser));
        when(transactionRepository.save(stored)).thenReturn(stored);

        // Request gửi userId mới và chỉ đổi type
        TransactionRequest request = new TransactionRequest(
                2L,
                TransactionType.EXPENSE,
                null,
                null,
                null,
                null
        );
        // Act: cập nhật user
        Transaction updated = transactionService.updateTransaction(15L, request);
        // Assert: user phải là user mới, các trường khác không bị ép null
        assertThat(updated.getUser()).isSameAs(newUser);
        verify(userRepository).findById(2L);
        verify(transactionRepository).save(stored);
    }

    @Test
    void getTransactionOrThrowThrowsWhenMissing() {
        // Arrange: repository trả về empty
        when(transactionRepository.findById(404L)).thenReturn(Optional.empty());

        // Act + Assert: kỳ vọng lỗi 404
        assertThatThrownBy(() -> transactionService.getTransactionOrThrow(404L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404")
                .hasMessageContaining("Transaction not found");
    }
}
