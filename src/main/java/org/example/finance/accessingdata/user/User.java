package org.example.finance.accessingdata.user;

import jakarta.persistence.*;

@Entity
@Table(name = "user")
public class User {
    @Id
    @GeneratedValue
    private Long id;
    private String name;

    @Column(unique = true)
    private String username;
    private String password;
    private String email;

    public User() {
    }
    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
    public Long getId() {return this.id;}
    public void setId(Long id) {this.id = id;}
    public String getName() {return this.name;}
    public void setName(String name) {this.name = name;}
    public String getEmail() {return this.email;}
    public void setEmail(String email) {this.email = email;}
    public String getUsername() {return username;}
    public void setUsername(String username) {this.username = username;}
    public String getPassword() {return this.password;}
    public void setPassword(String password) {this.password = password;}
}

