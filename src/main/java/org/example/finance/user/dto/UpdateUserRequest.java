package org.example.finance.user.dto;

public class UpdateUserRequest {
    private String name;
    private String email;
    private String username;
    private String phone;
    private String address;
    private String role;

    public UpdateUserRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
    public String getPhone() {return this.phone;}
    public void setPhone(String phone) {this.phone = phone;}
    public String getAddress() {return this.address;}
    public void setAddress(String address) {this.address = address;}
    public String getRole() {return this.role;}
    public void setRole(String role) {this.role = role;}
}
