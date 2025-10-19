package org.example.finance.accessingdata.user;

import org.example.finance.accessingdata.auth.Login;
import org.example.finance.accessingdata.auth.Register;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final Login loginService;
    private final Register registerService;

    public UserService(UserRepository userRepository, Login loginService, Register registerService) {
        this.userRepository = userRepository;
        this.loginService = loginService;
        this.registerService = registerService;
    }

    public String login(String username, String password) {
        return loginService.login(username, password);
    }

    public String register(String username, String email, String password) {
        return registerService.register(username, email, password);
    }

    public User getUserOrThrow(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is required");
        return userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    public Iterable<User> getAllUser() {
        return userRepository.findAll();
    }

}
