package com.jalennorris.server.Controllers;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
public class NotificationController {

    @PostMapping("/api/send-notification")
    public ResponseEntity<?> sendNotification(@RequestBody Map<String, Object> payload) {
        String expoPushToken = (String) payload.get("expoPushToken");
        String title = (String) payload.getOrDefault("title", "Hello!");
        String body = (String) payload.getOrDefault("body", "This is a notification from your backend!");
        Map<String, Object> data = (Map<String, Object>) payload.getOrDefault("data", new HashMap<>());

        if (expoPushToken == null || expoPushToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "expoPushToken is required"));
        }

        RestTemplate restTemplate = new RestTemplate();
        String expoUrl = "https://exp.host/--/api/v2/push/send";

        Map<String, Object> expoPayload = new HashMap<>();
        expoPayload.put("to", expoPushToken);
        expoPayload.put("sound", "default");
        expoPayload.put("title", title);
        expoPayload.put("body", body);
        expoPayload.put("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("Accept-Encoding", "gzip, deflate");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(expoPayload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(expoUrl, request, String.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to send notification: " + e.getMessage()));
        }
    }
}
