package com.example.soen341_backend.message;

import java.nio.file.Path;
import java.util.stream.Stream;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/** Interface for storage operations */
public interface StorageService {

  /** Initialize storage */
  void init();

  /**
   * Store a file
   *
   * @param file the file to store
   * @return the stored file name
   */
  String store(MultipartFile file);

  /**
   * Load all files as a stream of paths
   *
   * @return stream of paths
   */
  Stream<Path> loadAll();

  /**
   * Load a file as a path
   *
   * @param filename the file name
   * @return the path
   */
  Path load(String filename);

  /**
   * Load a file as a resource
   *
   * @param filename the file name
   * @return the resource
   */
  Resource loadAsResource(String filename);

  /**
   * Delete a file
   *
   * @param filename the file name
   */
  void delete(String filename);

  /** Delete all files */
  void deleteAll();
}
