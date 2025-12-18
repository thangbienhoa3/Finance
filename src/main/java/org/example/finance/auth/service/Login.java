package org.example.finance.auth.service;


import org.example.finance.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class Login {
    private final UserRepository repo;
    public Login(UserRepository repo) {
        this.repo = repo;
    }
    public String login(String username, String password) {
        return repo.findByUsername(username).filter(user -> user.getPassword().equals(password)).map(user -> "User logged in successfully!").orElse(
                "Invalid username or password"
        );
    }
}
