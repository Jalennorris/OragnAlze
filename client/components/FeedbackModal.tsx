import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FeedbackModalProps {
  isVisible: boolean;
  feedbackRating: number;
  feedbackText: string;
  feedbackLoading: boolean;
  onSetRating: (rating: number) => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const FEEDBACK_LABELS = [
  "Terrible",
  "Not Good",
  "Okay",
  "Good",
  "Amazing!",
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isVisible,
  feedbackRating,
  feedbackText,
  feedbackLoading,
  onSetRating,
  onChangeText,
  onSubmit,
  onClose,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>How was your AI plan?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => onSetRating(star)}
                style={styles.starButton}
                accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                {feedbackRating >= star ? (
                  <LinearGradient
                    colors={['#FFD700', '#FFB300']}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.modernStarGradient}
                  >
                    <Ionicons
                      name="star"
                      size={40}
                      color="#fff"
                      style={{ textShadowColor: '#FFD700', textShadowRadius: 8 }}
                    />
                  </LinearGradient>
                ) : (
                  <View style={styles.modernStarUnselected}>
                    <Ionicons
                      name="star-outline"
                      size={40}
                      color="#AAA"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.labelText}>
            {feedbackRating ? FEEDBACK_LABELS[feedbackRating - 1] : "Tap a star to rate"}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                minHeight: 40,
                maxHeight: 80,
                width: '100%',
                backgroundColor: '#232B3A',
                borderRadius: 8,
                color: '#fff',
                marginTop: 18,
                marginBottom: 16,
              },
            ]}
            placeholder="Optional feedback..."
            placeholderTextColor="#AAA"
            value={feedbackText}
            onChangeText={onChangeText}
            multiline
            editable={!feedbackLoading}
          />
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: '#4CAF50', minWidth: 120, justifyContent: 'center' },
            ]}
            onPress={onSubmit}
            disabled={feedbackLoading}
            accessibilityLabel="Submit feedback"
          >
            {feedbackLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.actionButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.cancelButton,
              { marginTop: 10, minWidth: 120, justifyContent: 'center' },
            ]}
            onPress={onClose}
            disabled={feedbackLoading}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,20,30,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#181828',
    borderRadius: 18,
    padding: 24,
    width: 320,
    alignItems: 'center',
    elevation: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    marginHorizontal: 4,
    borderRadius: 32,
    overflow: 'hidden',
  },
  modernStarGradient: {
    borderRadius: 32,
    padding: 2,
  },
  modernStarUnselected: {
    borderRadius: 32,
    padding: 2,
    backgroundColor: 'transparent',
  },
  labelText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 10,
    minHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#232B3A',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 80,
    width: '100%',
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#888',
  },
});

export default FeedbackModal;
