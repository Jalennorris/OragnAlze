import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

// Add pastel color palette for bubbles
const pastelBubbles = [
  '#A6BFFF', '#B2FFD6', '#FFD6E0', '#FFF6B7',
  '#D1B3FF', '#F3E8FF', '#B7E0FF', '#F9EFFF'
];

interface GoalSuggestionAlgorithmProps {
  userGoals?: string[];
  allGoals?: string[];
  query: string;
  onSuggestionPress: (suggestion: string) => void;
  maxSuggestions?: number;
}

const GoalSuggestionAlgorithm: React.FC<GoalSuggestionAlgorithmProps> = ({
  userGoals = [],
  allGoals = [],
  query,
  onSuggestionPress,
  maxSuggestions = 8,
}) => {
  // Ensure suggestions are calculated safely
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const filterGoals = (goals: string[]) =>
      goals.filter(
        g =>
          g &&
          g.toLowerCase().includes(query.trim().toLowerCase()) &&
          g.trim().length > 0
      );
    const userFiltered = filterGoals(Array.isArray(userGoals) ? userGoals : []);
    const allFiltered = filterGoals(Array.isArray(allGoals) ? allGoals : []).filter(
      g => !userFiltered.includes(g)
    );
    const half = Math.floor(maxSuggestions / 2);
    const userPart = userFiltered.slice(0, half);
    const allPart = allFiltered.slice(0, maxSuggestions - userPart.length);
    return [...userPart, ...allPart];
  }, [userGoals, allGoals, query, maxSuggestions]);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.suggestionBubbleContainer}>
      {suggestions.map((s, idx) => (
        <TouchableOpacity
          key={s + idx}
          style={[
            styles.suggestionBubble,
            { backgroundColor: pastelBubbles[idx % pastelBubbles.length] }
          ]}
          onPress={() => onSuggestionPress(s)}
          activeOpacity={0.85}
        >
          <Text style={styles.suggestionBubbleText}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  suggestionBubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
    zIndex: 100,
  },
  suggestionBubble: {
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  suggestionBubbleText: {
    color: '#232B3A',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GoalSuggestionAlgorithm;
