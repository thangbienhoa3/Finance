package org.example.finance.accessingdata.user;

import org.example.finance.accessingdata.auth.Login;
import org.example.finance.accessingdata.auth.Register;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

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

    public User updateUser(Long userId, UpdateUserRequest request) {
        User user = getUserOrThrow(userId);
        System.out.println(request.getPhone() + " " + request.getAddress() + " " + request.getRole());
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        boolean updated = false;

        if (StringUtils.hasText(request.getUsername()) && !Objects.equals(user.getUsername(), request.getUsername())) {
            userRepository.findByUsername(request.getUsername())
                    .filter(existing -> !Objects.equals(existing.getId(), userId))
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use");
                    });
            user.setUsername(request.getUsername());
            updated = true;
        }

        if (StringUtils.hasText(request.getEmail()) && !Objects.equals(user.getEmail(), request.getEmail())) {
            userRepository.findByEmail(request.getEmail())
                    .filter(existing -> !Objects.equals(existing.getId(), userId))
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
                    });
            user.setEmail(request.getEmail());
            updated = true;
        }

        if (StringUtils.hasText(request.getName()) && !Objects.equals(user.getName(), request.getName())) {
            user.setName(request.getName());
            updated = true;
        }

        if (StringUtils.hasText(request.getPhone()) && !Objects.equals(user.getPhone(), request.getPhone())) {
            user.setPhone(request.getPhone());
            updated = true;
        }

        if (StringUtils.hasText(request.getAddress()) && !Objects.equals(user.getAddress(), request.getAddress())) {
            user.setAddress(request.getAddress());
            updated = true;
        }

        if (StringUtils.hasText(request.getRole()) && !Objects.equals(user.getRole(), request.getRole())) {
            user.setRole(request.getRole());
            updated = true;
        }

        if (!updated) {
            return user;
        }

        return userRepository.save(user);
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        if (!StringUtils.hasText(request.getOldPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is required");
        }

        if (!StringUtils.hasText(request.getNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password confirmation does not match");
        }

        User user = getUserOrThrow(userId);

        if (!user.getPassword().equals(request.getOldPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is incorrect");
        }

        user.setPassword(request.getNewPassword());
        userRepository.save(user);
    }
}
