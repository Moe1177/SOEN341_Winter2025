package com.example.soen341_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtUtils jwtUtils;
  private final UserDetailsService userDetailsService;

  /**
   * Filters incoming HTTP requests to validate the JWT token in the "Authorization" header 
   * or query parameter. If the token is valid, it authenticates the user by setting the 
   * authentication context. If no valid token is found, the request is passed through the 
   * filter chain without authentication.
   *
   * @param request The HttpServletRequest object that contains the request from the client.
   * @param response The HttpServletResponse object used to send a response to the client.
   * @param filterChain The FilterChain that allows the request to continue to the next filter or
   *     resource.
   * @throws IOException If an input or output exception occurs during the filtering process.
   * @throws ServletException If the request processing fails.
   */
  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws IOException, ServletException {
    String jwt = null;
    
    // First try to get token from Authorization header
    final String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      jwt = authHeader.substring(7);
    }
    
    // If not found in header, try to get from query parameter
    if (jwt == null) {
      String tokenParam = request.getParameter("token");
      if (tokenParam != null && !tokenParam.isEmpty()) {
        jwt = tokenParam;
      }
    }
    
    // If no token found, continue the filter chain
    if (jwt == null) {
      filterChain.doFilter(request, response);
      return;
    }
    
    // Try to extract username from token
    String username = null;
    try {
      username = jwtUtils.extractUsername(jwt);
    } catch (Exception e) {
      // If token is invalid, continue without authentication
      filterChain.doFilter(request, response);
      return;
    }

    // If a valid username is found and no authentication is set, validate the token and set
    // authentication context
    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      UserDetails userDetails = userDetailsService.loadUserByUsername(username);

      // If the token is valid and user details are loaded, authenticate the user
      if (jwtUtils.validateToken(jwt) && userDetails != null) {
        UsernamePasswordAuthenticationToken authToken =
            new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        // Set the authentication context with the user's authentication token
        SecurityContextHolder.getContext().setAuthentication(authToken);
      }
    }

    // Proceed with the filter chain
    filterChain.doFilter(request, response);
  }
}
