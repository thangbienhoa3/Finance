package org.example.finance.config;


import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // tắt CSRF để gửi POST dễ dàng
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login.html", "/register.html", "/style.css", "/main.js").permitAll()
                        .anyRequest().permitAll() // cho phép mọi request (ko cần login)
                ).formLogin(form -> form.loginPage("/login.html").defaultSuccessUrl("/index.html").permitAll());
        return http.build();
    }

}
