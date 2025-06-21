package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserFeedback;
import com.jalennorris.server.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping
    public ResponseEntity<List<UserFeedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackService.getAllFeedback());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserFeedback> getFeedbackById(@PathVariable Long id) {
        Optional<UserFeedback> feedback = feedbackService.getFeedbackById(id);
        return feedback.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserFeedback> createFeedback(@RequestBody UserFeedback feedback) {
        return ResponseEntity.status(201).body(feedbackService.createFeedback(feedback));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserFeedback> updateFeedback(@PathVariable Long id, @RequestBody UserFeedback feedback) {
        Optional<UserFeedback> updated = feedbackService.updateFeedback(id, feedback);
        return updated.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id) {
        boolean deleted = feedbackService.deleteFeedback(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
