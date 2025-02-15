package com.example.soen341_backend.server;

import com.example.soen341_backend.channel.Channel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document
@Data
@Builder
@AllArgsConstructor
public class Server {
    @Id
    private String id;
    private String name;
    private String inviteCode;
    private List<Member> members;
    private List<Channel> channels;

    public Server(String name, String inviteCode, List<Member> members, List<Channel> channels) {
        this.name = name;
        this.inviteCode = inviteCode;
        this.members = members;
        this.channels = channels;
    }
}
