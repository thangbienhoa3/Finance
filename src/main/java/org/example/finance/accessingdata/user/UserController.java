package org.example.finance.accessingdata.user;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:8080")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public String register(@RequestParam String username, @RequestParam String password,  @RequestParam String email) {
        return  service.register(username, password, email);
    }
    @PostMapping("/login")
    public String login(@RequestParam String username, @RequestParam String password) {
        return  service.login(username, password);
    }
    @PutMapping("/{userId}")
    public User updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest request) {
        return service.updateUser(userId, request);
    }

    @PostMapping("/{userId}/change-password")
    public String changePassword(@PathVariable Long userId, @RequestBody ChangePasswordRequest request) {
        service.changePassword(userId, request);
        return "Password updated successfully!";
    }


    @GetMapping("/{userId}")
    public User getUserByUserId(@PathVariable Long userId) {
        return service.getUserOrThrow(userId);
    }

    @GetMapping("/by-username/{username}")
    public User getUserByUsername(@PathVariable String username) {
        return service.getUserByUsername(username);
    }

    @GetMapping
    public @ResponseBody Iterable<User> getAllUsers() {
        // This returns a JSON or XML with the users
        return service.getAllUser();
    }
}
