package org.example.finance.accessingdata.auth;


import org.example.finance.accessingdata.user.User;
import org.example.finance.accessingdata.user.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class Register {

    private final UserRepository repo;

    public Register(UserRepository repo) {
        this.repo = repo;
    }


    public String register(String username, String password, String email) {
        if (repo.findByUsername(username).isPresent()) {
            return "User already exists";
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(password);
        u.setEmail(email);
        repo.save(u);
        return "User registered successfully!";
    }
}
