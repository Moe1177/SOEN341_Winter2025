package com.example.soen341_backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // Inject JwtAuthFilter via constructor
    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configures the security filter chain for the application, defining the security policies for incoming HTTP requests.
     * This configuration disables CSRF protection, allows public access to certain endpoints, and ensures that
     * other endpoints are authenticated. Additionally, it adds a custom JWT authentication filter before the
     * {@link UsernamePasswordAuthenticationFilter} in the filter chain.
     *
     * @param http The {@link HttpSecurity} object used to configure the security settings.
     * @return The configured {@link SecurityFilterChain} that is used by Spring Security to protect the application.
     * @throws Exception If any error occurs during the security configuration setup.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()  // Disable CSRF protection (typically for stateless APIs)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/users/**").permitAll()      // Allow public access to user registration endpoint
                        .requestMatchers("/api/auth/**").permitAll()      // Allow public access to authentication endpoints
                        .requestMatchers("/api/auth/login").permitAll()   // Allow public access to login endpoint
                        .anyRequest().authenticated()                     // Secure all other endpoints
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class) // Add custom JWT filter
                .formLogin().disable()  // Disable form-based login
                .httpBasic().disable(); // Disable basic HTTP authentication

        return http.build();
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
