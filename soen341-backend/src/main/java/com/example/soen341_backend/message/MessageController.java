package com.example.soen341_backend.message;

import com.example.soen341_backend.channel.ChannelService;
import com.example.soen341_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MessageController {

  private final UserRepository userRepository;
  private final MessageService messageService;
  private final ChannelService channelService;
}
