package org.example.finance.accessingdata.user;

import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }


    public String register(String username, String password, String email) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(password);
        u.setEmail(email);

        if (repo.findByUsername(username) != null) {
            return "User already exists";
        }
        
        repo.save(u);
        return "User registered successfully!";
    }
    public String login(String username, String password) {
        return repo.findByUsername(username).filter(u -> u.getPassword().equals(password)).
                map(u -> "User logged in successfully!").orElse("Invalid username or password!");
    }
    public Iterable<User> getAllUser() {
        return repo.findAll();
    }
}
