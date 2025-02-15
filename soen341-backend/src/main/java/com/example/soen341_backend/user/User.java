package com.example.soen341_backend.user;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document()
public class User {
    @Id
    private String id;

    private String username;
    private String email;
    private String password;
    private Status status;
    private List<String> channelIds;
    private Instant createdAt;
    private Instant lastActiveAt;
    private boolean verified = false;
    private String verificationCode;
    private Instant verificationCodeExpiration;

}
