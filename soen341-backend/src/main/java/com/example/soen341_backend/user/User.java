package com.example.soen341_backend.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @NotBlank(message = "Username cannot be blank")
    @Indexed(unique = true)
    private String username;

    @Email(message = "Email needs to have a valid format")
    @Indexed(unique = true)
    private String email;

    @NotBlank(message = "Password cannot be blank")
    private String password;

    private Status status;
    private List<String> channelIds;
    private Instant createdAt;
    private Instant lastActiveAt;

}
