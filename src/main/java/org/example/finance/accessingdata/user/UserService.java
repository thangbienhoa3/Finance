package org.example.finance.accessingdata.user;

import org.example.finance.accessingdata.auth.Login;
import org.example.finance.accessingdata.auth.Register;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository repo;
    private final Login loginService;
    private final Register registerService;

    public UserService(UserRepository repo, Login loginService, Register registerService) {
        this.repo = repo;
        this.loginService = loginService;
        this.registerService = registerService;
    }

    public String login(String username, String password) {
        return loginService.login(username, password);
    }

    public String register(String username, String email, String password) {
        return registerService.register(username, email, password);
    }

    public Iterable<User> getAllUser() {
        return repo.findAll();
    }

}
