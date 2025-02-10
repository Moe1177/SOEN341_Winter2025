package com.example.soen341_backend.channel;

import com.example.soen341_backend.user.User;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document
public class Channel {
    @Id
    private String id;

    private String name;
    private String creatorId;
    private String inviteCode;
    private List<Member> members;
}
