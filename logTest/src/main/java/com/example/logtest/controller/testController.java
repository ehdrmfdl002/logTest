package com.example.logtest.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@Slf4j
public class testController {
    private static final Logger logger = LoggerFactory.getLogger(testController.class);

    @PostMapping("/test")
    public ResponseEntity<?> test(@RequestParam("userId") String userId) throws Exception {
        MDC.put("userId", userId); // Set userId in MDC
        logger.info("Received request with userId: {}", userId);
        MDC.remove("userId"); // Clean up MDC after logging
        return new ResponseEntity<>(userId, HttpStatus.OK);
    }

    @GetMapping("/read")
    public Map<String, Integer> readLogFile() {
        Map<String, Integer> userIdCountMap = new HashMap<>();
        String filePath = "logs\\application.2023-07-24_23-28.0.log"; // 파일 경로 예시

        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            Pattern pattern = Pattern.compile("\"userId\":\"(.*?)\"");

            while ((line = br.readLine()) != null) {
                Matcher matcher = pattern.matcher(line);
                if (matcher.find()) {
                    String userId = matcher.group(1);
                    userIdCountMap.put(userId, userIdCountMap.getOrDefault(userId, 0) + 1);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        // userId별로 갯수를 카운팅한 결과를 반환
        return userIdCountMap;
    }
}
