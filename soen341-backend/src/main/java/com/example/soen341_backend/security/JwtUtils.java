package com.example.soen341_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtUtils {

  private static final String SECRET_KEY =
      "YourSuperSecretKeyForJwtDontShare123456789012"; // Use 256-bit key
  private static final long EXPIRATION_TIME = 86400000; // 1 day

  /**
   * Generates and returns a signing key used for HMAC (Hash-based Message Authentication Code)
   * signing. The key is derived from the predefined secret key string by converting it into a byte
   * array. This signing key is used for signing or validating JWT tokens.
   *
   * @return The signing key used for HMAC SHA-based signing, represented as a {@link Key} object.
   */
  private Key getSigningKey() {
    return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
  }

  /**
   * Generates a JWT (JSON Web Token) for a given username. The token is created with the specified
   * username as the subject, the current timestamp as the issue date, and an expiration time
   * calculated from the current time. The token is signed using the HMAC SHA-256 algorithm with a
   * signing key derived from the predefined secret key.
   *
   * @param username The username for which the JWT token is generated. This value is used as the
   *     subject of the token.
   * @return The generated JWT token as a {@link String}.
   */
  public String generateToken(String username) {
    return Jwts.builder()
        .setSubject(username)
        .setIssuedAt(new Date(System.currentTimeMillis()))
        .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  /**
   * Validates the provided JWT token by parsing it and verifying its signature. The token is parsed
   * using the signing key derived from the predefined secret key. If the token is valid (i.e., it
   * can be parsed and its signature matches the signing key), the method returns true. If any
   * exception occurs during the parsing or validation, it logs an error and returns false.
   *
   * @param token The JWT token to be validated.
   * @return {@code true} if the token is valid and the signature is correct, {@code false}
   *     otherwise.
   */
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      log.error("Invalid JWT token: {}", e.getMessage());
      return false;
    }
  }

  /**
   * Extracts the username (subject) from the given JWT token. The method utilizes the {@link
   * Claims} object to retrieve the subject (username) from the token's claims.
   *
   * @param token The JWT token from which the username (subject) will be extracted.
   * @return The username (subject) contained in the JWT token, or {@code null} if the token is
   *     invalid or the subject is not found.
   */
  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  /**
   * Extracts a specific claim from the given JWT token using a claims resolver function. The method
   * parses the token, retrieves the claims, and applies the provided claims resolver to extract the
   * desired claim.
   *
   * @param <T> The type of the claim to be extracted.
   * @param token The JWT token from which the claim will be extracted.
   * @param claimsResolver A function that defines how to extract the desired claim from the {@link
   *     Claims} object. Typically, this could be a method reference like {@link Claims#getSubject}
   *     for the username.
   * @return The extracted claim of type {@code T}.
   */
  public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    final Claims claims =
        Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    return claimsResolver.apply(claims);
  }
}
