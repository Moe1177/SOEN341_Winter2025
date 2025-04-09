package com.example.soen341_backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

@Configuration
public class GridFSConfig {

  @Bean
  public GridFsTemplate gridFsTemplate(
      MongoDatabaseFactory dbFactory, MongoConverter converter) {
    return new GridFsTemplate(dbFactory, converter);
  }

  @Bean
  public GridFSBucket gridFSBucket(MongoClient mongoClient) {
    MongoDatabase db = mongoClient.getDatabase("soen341");
    return GridFSBuckets.create(db);
  }
} 