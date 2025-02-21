package com.example.soen341_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    /**
     * Filters incoming HTTP requests to validate the JWT token in the "Authorization" header.
     * If the token is valid, it authenticates the user by setting the authentication context.
     * If the "Authorization" header is missing or invalid, the request is passed through the filter chain without further processing.
     *
     * @param request The HttpServletRequest object that contains the request from the client.
     * @param response The HttpServletResponse object used to send a response to the client.
     * @param filterChain The FilterChain that allows the request to continue to the next filter or resource.
     * @throws IOException If an input or output exception occurs during the filtering process.
     * @throws ServletException If the request processing fails.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws IOException, ServletException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // If there is no Authorization header or the header doesn't start with "Bearer", pass the request along the filter chain
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the JWT from the Authorization header
        jwt = authHeader.substring(7);
        username = jwtUtils.extractUsername(jwt);

        // If a valid username is found and no authentication is set, validate the token and set authentication context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // If the token is valid and user details are loaded, authenticate the user
            if (jwtUtils.validateToken(jwt) && userDetails != null) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the authentication context with the user's authentication token
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Proceed with the filter chain
        filterChain.doFilter(request, response);
    }

}
