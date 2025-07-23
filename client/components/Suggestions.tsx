import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import OpenAI from 'openai';
import config from '@/src/config';

interface SuggestionsProps {
  onSuggestionSelect?: (suggestion: string) => void;
  showTitle?: boolean;
  userHistory?: string[];
}

const API_MODEL = "microsoft/mai-ds-r1:free";

const Suggestions: React.FC<SuggestionsProps> = ({ onSuggestionSelect, showTitle = true }) => {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const openai = React.useMemo(() => new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.OAI_KEY,
    timeout: 30 * 1000,
    maxRetries: 1,
  }), []);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: API_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Suggest 8 creative and practical example prompts a user could ask an AI task planner. Respond with a JSON array of strings, each being a prompt idea. Do not include any explanation.",
          },
          {
            role: "user",
            content: "Give me example prompts for an AI task planner.",
          },
        ],
      });
      let parsed: string[] = [];
      try {
        const content = response.choices[0]?.message?.content || "[]";
        parsed = JSON.parse(content.match(/\[([\s\S]*?)\]/) ? content.match(/\[([\s\S]*?)\]/)![0] : content);
      } catch {
        parsed = [];
      }
      setIdeas([...new SetArray.isArray(parsed) ? parsed : []]);
    } catch {
      setIdeas([
        "Plan my week for studying for finals.",
        "Help me organize a home renovation project.",
        "Create a fitness routine for 5 days.",
        "Suggest a daily routine for better sleep.",
        "Help me prepare for a job interview.",
        "Organize a meal prep schedule.",
        "Plan a reading challenge for a month.",
        "Set up a daily mindfulness routine."
      ]);
    } finally {
      setLoading(false);
    }
  }, [openai]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>
          <Ionicons name="bulb-outline" size={22} color="#BB86FC" /> Suggestions for your AI Task Planner
        </Text>
      )}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Loading ideas...</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ideasList}
        >
          {ideas.map((idea, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.ideaChip}
              onPress={() => onSuggestionSelect?.(idea)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#2952A3', '#1D2327', '#E3EAEE', '#FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ideaChipGradient}
              >
                <Text style={styles.ideaText}>{idea}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'flex-start',
    backgroundColor: '#181A20',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#BB86FC',
    marginBottom: 18,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  loadingText: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 12,
  },
  ideasList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ideaChip: {
    marginRight: 12,
    marginBottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
  },
  ideaChipGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    minWidth: 180,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  ideaText: {
    color: '#232B3A',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Suggestions;
