package org.example.finance.accessingdata.budgets;

import jakarta.persistence.*;
import org.example.finance.accessingdata.user.User;

@Entity
public class Budget {

    @Id
    @GeneratedValue
    private Long id;

    private double amount;

    @OneToOne(cascade = CascadeType.ALL)
    private User userid;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }
    public void setAmount(double amount) {
        this.amount = amount;
    }
    public double getAmount() {
        return amount;
    }

    public void setUserid(User userid) {
        this.userid = userid;
    }
    public User getUserid() {
        return userid;
    }
}
