package com.uranus.lms.modules.file;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Stores a file and returns its access URL or path.
     */
    String storeFile(MultipartFile file);

    /**
     * Loads a file as a Spring Resource.
     */
    Resource loadFileAsResource(String fileName);
}
