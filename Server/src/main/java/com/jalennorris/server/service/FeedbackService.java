package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserFeedback;
import com.jalennorris.server.Repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Autowired
    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public UserFeedback createFeedback(UserFeedback feedback) {
        return feedbackRepository.save(feedback);
    }

    public List<UserFeedback> createFeedbackBatch(List<UserFeedback> feedbackList) {
        return feedbackRepository.saveAll(feedbackList);
    }

    public Optional<UserFeedback> getFeedbackById(Long id) {
        return feedbackRepository.findById(id);
    }

    public List<UserFeedback> getFeedbackByUserId(Long userId) {
        return feedbackRepository.findByUser(userId);
    }

    public List<UserFeedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public Optional<UserFeedback> updateFeedback(Long id, UserFeedback updatedFeedback) {
        return feedbackRepository.findById(id).map(feedback -> {
            if (updatedFeedback.getUser() != null) {
                feedback.setUser(updatedFeedback.getUser());
            }
            feedback.setFeedbackText(updatedFeedback.getFeedbackText());
            feedback.setRating(updatedFeedback.getRating());
            feedback.setCreatedAt(updatedFeedback.getCreatedAt());
            feedback.setAcceptedAITaskId(updatedFeedback.getAcceptedAITaskId());
            return feedbackRepository.save(feedback);
        });
    }

    public Optional<UserFeedback> patchFeedback(Long id, UserFeedback patch) {
        return feedbackRepository.findById(id).map(feedback -> {
            if (patch.getUser() != null) feedback.setUser(patch.getUser());
            if (patch.getFeedbackText() != null) feedback.setFeedbackText(patch.getFeedbackText());
            if (patch.getRating() != null) feedback.setRating(patch.getRating());
            if (patch.getCreatedAt() != null) feedback.setCreatedAt(patch.getCreatedAt());
            if (patch.getAcceptedAITaskId() != null) feedback.setAcceptedAITaskId(patch.getAcceptedAITaskId());
            return feedbackRepository.save(feedback);
        });
    }

    public boolean deleteFeedback(Long id) {
        if (feedbackRepository.existsById(id)) {
            feedbackRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
