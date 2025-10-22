package org.example.finance.accessingdata.transactions;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.example.finance.accessingdata.user.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private User user;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(precision = 19, scale = 2, nullable = false)
    private BigDecimal amount;

    private String category;

    @Column(length = 500)
    private String description;

    @Column(name = "transaction_date")
    private LocalDate transactionDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Transaction() {}
    public Transaction(User user, TransactionType type, BigDecimal amount, String category,
                       String description, LocalDate transactionDate, LocalDateTime createdAt) {
        this.user = user;
        this.type = type;
        this.amount = amount;
        this.category = category;
        this.description = description;
    }

    @PrePersist
    public void prePersist() {
        if (transactionDate == null) {
            transactionDate = LocalDate.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public User getUser() {return user;}
    public void setUser(User user) {this.user = user;}
    public TransactionType getType() {return type;}
    public void setType(TransactionType type) {this.type = type;}
    public BigDecimal getAmount() {return this.amount;}
    public void setAmount(BigDecimal amount) {this.amount = amount;}
    public String getCategory() {return category;}
    public void setCategory(String category) {this.category = category;}
    public String getDescription() {return description;}
    public void setDescription(String description) {this.description = description;}
    public LocalDate getTransactionDate() {return transactionDate;}
    public void setTransactionDate(LocalDate transactionDate) {this.transactionDate = transactionDate;}
    public LocalDateTime getCreatedAt() {return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt) {this.createdAt = createdAt;}
    @Override
    public String toString() {
        return "Transaction{" +
                "id=" + id +
                ", userId=" + (user != null ? user.getId() : null) +
                ", type=" + type +
                ", amount=" + amount +
                ", category='" + category + '\'' +
                ", description='" + description + '\'' +
                ", transactionDate=" + transactionDate +
                ", createdAt=" + createdAt +
                '}';
    }


}
