package com.example.soen341_backend.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

  List<User> findAllByStatus(Status status);

  Optional<User> findByEmail(String email);

  Optional<User> findByUsername(String username);

  List<User> findByVerified(boolean verified);

  Optional<User> findByResetCode(String resetToken);

  boolean existsByUsername(String username);

  boolean existsByEmail(String email);
}
