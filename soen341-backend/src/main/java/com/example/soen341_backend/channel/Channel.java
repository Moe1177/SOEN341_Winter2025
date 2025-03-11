package com.example.soen341_backend.channel;

import jakarta.validation.constraints.NotBlank;
import java.util.HashSet;
import java.util.Set;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "channels")
public class Channel {
  @Id private String id;

  @Indexed(unique = true)
  @NotBlank(message = "Channels must have a name")
  private String name;

  private String creatorId;
  private ChannelType channelType;

  @Indexed(unique = true)
  private String inviteCode;

  private Set<String> members = new HashSet<>();
  private boolean isDirectMessage;
  private Set<String> directMessageMembers = new HashSet<>();
}
