package com.example.soen341_backend.server;

import lombok.*;

import java.time.Instant;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Member {
    private String userId;
    private String role;
    private Instant joinedAt;
    private Instant lastReadAt;

}
