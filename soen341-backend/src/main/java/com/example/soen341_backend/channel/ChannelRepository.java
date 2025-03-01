package com.example.soen341_backend.channel;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {

  Optional<Channel> findByInviteCode(String inviteCode);

  Optional<Channel> findByName(String name);

  @Query("{ 'members': ?0, 'isDirectMessage': true }")
  List<Channel> findByIsDirectMessageFalse();

  @Query("{ 'directMessageMembers': ?0 }")
  List<Channel> findIfMemberIsInDirectMessage(String userId);
}
