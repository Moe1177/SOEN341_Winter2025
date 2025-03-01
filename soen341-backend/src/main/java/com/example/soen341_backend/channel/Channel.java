package com.example.soen341_backend.channel;

import java.util.HashSet;
import java.util.Set;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "channels")
public class Channel {
  @Id private String id;

  private String name;
  private String creatorId;
  private String inviteCode;
  private Set<String> members = new HashSet<>();
  private boolean isDirectMessage = false;
  private Set<String> directMessageMembers = new HashSet<>();
}
