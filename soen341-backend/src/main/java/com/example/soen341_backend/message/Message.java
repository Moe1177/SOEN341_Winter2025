package com.example.soen341_backend.message;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "messages")
public class Message {

    @Id private String id;

    private String senderId;
    private String channelId;
    private String receiverId;
    private String username;
    private String content;
    private Instant timestamp;
}
