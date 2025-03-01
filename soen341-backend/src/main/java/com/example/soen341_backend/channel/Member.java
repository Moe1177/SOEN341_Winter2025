package com.example.soen341_backend.channel;

import java.time.Instant;
import lombok.*;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Member {
  private String userId;
  private MemberRole role;
  private Instant joinedAt;
  private Instant lastReadAt;
}
