import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GoalSuggestionAlgorithm from './GoalSuggestionAlgorithm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Add axios import


// Helper to format date as 'YYYY-MM-DDTHH:mm:ss' (no ms, no Z, local time)
const formatLocalDateTime = (date: string | Date | null) => {
  if (!date) return "";
  if (typeof date === "string") {
    // If already in 'YYYY-MM-DDTHH:mm:ss' format, return as-is
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date)) {
      return date;
    }
    // Remove ms and 'Z' or timezone offset if present, then parse
    const clean = date.replace(/\.\d{3,}Z?$/, '').replace(/Z$/, '').replace(/([+-]\d{2}:?\d{2})$/, '');
    // Try to parse as local time
    const parts = clean.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
    if (parts) {
      // Already correct format, return
      return clean;
    }
    // Fallback: parse as Date and format as local time
    const d = new Date(clean);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  } else {
    // Date object: format as local time
    const d = date;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  }
};

interface TaskInputAreaProps {
  aiQuery: string;
  setAiQuery: (query: string) => void;
  numDays: number;
  setNumDays: (days: number) => void;
  isLoading: boolean;
  errorMessage: string;
  inputRef: React.RefObject<TextInput>;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  smartDefault: string;
  handleSmartDefaultPress: () => void;
  SHORTCUTS: Array<{label: string, days: number, prompt?: string}>;
  dayOptions: number[];
  userHistory: {goals: any[]};
  allGoals: any[];
  handleGoalSuggestionSelect: (suggestion: any) => void;
  SURPRISE_GRADIENT: string[];
  handleSurpriseMe: () => void;
  surprisePressed: boolean;
  setSurprisePressed: (pressed: boolean) => void;
  styles: any;
  handleStopGeneration: () => void;
  fetchAIResponse: () => void;
  resetModalState: (keepQuery?: boolean) => void;
  handleAcceptAllTasks: () => void;
  suggestedTasks: any[];
}

const TaskInputArea: React.FC<Omit<TaskInputAreaProps, 'userId'>> = ({
  aiQuery,
  setAiQuery,
  numDays,
  setNumDays,
  isLoading,
  errorMessage,
  inputRef,
  showAdvanced,
  setShowAdvanced,
  smartDefault,
  handleSmartDefaultPress,
  SHORTCUTS,
  dayOptions,
  userHistory,
  allGoals,
  handleGoalSuggestionSelect,
  SURPRISE_GRADIENT,
  handleSurpriseMe,
  surprisePressed,
  setSurprisePressed,
  styles,
  handleStopGeneration,
  fetchAIResponse,
  suggestedTasks,
  resetModalState,
  handleAcceptAllTasks,
}) => {
  const [minHeight, setMinHeight] = useState(50);
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const handleTextChange = (text: string) => {
    setAiQuery(text);

    // Smoothly increase minHeight: 50 + 1 per 2 chars over 50, max 120
    const base = 50;
    const max = 120;
    const extra = Math.max(0, text.length - 50);
    const newHeight = Math.min(max, base + Math.floor(extra / 2));
    setMinHeight(newHeight);
  };

  return (
    <View style={styles.inputArea}>
    
     
      
      {/* --- Goal Suggestions --- */}
      <GoalSuggestionAlgorithm
        userGoals={Array.isArray(userHistory.goals) ? userHistory.goals : []}
        allGoals={Array.isArray(allGoals) ? allGoals : []}
        query={aiQuery}
        onSuggestionPress={handleGoalSuggestionSelect}
      />
      
      {/* --- Surprise Me Button (commented out) --- */}
      {/* {aiQuery.trim().length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
          <Animated.View style={{ transform: [{ scale: surprisePressed ? 0.96 : 1 }] }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSurpriseMe}
              onPressIn={() => setSurprisePressed(true)}
              onPressOut={() => setSurprisePressed(false)}
              style={{ borderRadius: 24, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={SURPRISE_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.surpriseBubble}
              >
                <Ionicons name="sparkles" size={18} color="#BB86FC" style={{ marginRight: 6 }} />
                <Text style={styles.surpriseBubbleText}>Surprise Me!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )} */}

      {errorMessage && !isLoading && suggestedTasks.length > 0 && (
        <Text style={styles.errorTextInline}>{errorMessage}</Text>
      )}

      <View style={styles.compactChipsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactChipsScroll}
          style={{ flexGrow: 0 }}
        >
          {smartDefault && (
            <TouchableOpacity
              style={styles.compactSmartChip}
              onPress={handleSmartDefaultPress}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={16} color="#6C47FF" style={{ marginRight: 4 }} />
              <Text style={styles.compactSmartChipText} numberOfLines={1}>Plan: {smartDefault}</Text>
            </TouchableOpacity>
          )}
          {Array.isArray(SHORTCUTS) && SHORTCUTS.length > 0 ? (
            SHORTCUTS.map((sc: any, idx: number) => (
              <TouchableOpacity
                key={sc.label}
                style={[
                  styles.compactShortcutChip,
                  numDays === sc.days && styles.compactShortcutChipSelected,
                ]}
                onPress={() => {
                  setNumDays(sc.days);
                  if (sc.prompt) setAiQuery(sc.prompt);
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    sc.label === "Today"
                      ? "sunny"
                      : sc.label === "Tomorrow"
                      ? "cloud-outline"
                      : sc.label === "Weekend"
                      ? "calendar"
                      : "calendar-outline"
                  }
                  size={15}
                  color={numDays === sc.days ? "#fff" : "#6C47FF"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.compactShortcutChipText,
                    numDays === sc.days && styles.compactShortcutChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {sc.label}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: '#AAA', fontSize: 12, marginLeft: 4, opacity: 0.7 }}>
              No shortcuts
            </Text>
          )}
        </ScrollView>
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced((v: boolean) => !v)}
          activeOpacity={0.8}
          accessibilityLabel="Show advanced options"
        >
          <Ionicons name={showAdvanced ? "chevron-up" : "options-outline"} size={20} color="#BB86FC" />
        </TouchableOpacity>
      </View>
      <View style={styles.chipDivider} />

      {/* --- Advanced: Day Selector --- */}
      {showAdvanced && (
        <View style={styles.daySelectorContainer}>
          <Text style={styles.daySelectorLabel}>Plan Duration:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.daySelectorScrollContent}
            style={styles.daySelectorScrollView}
          >
            {Array.isArray(dayOptions) ? dayOptions.map((day: number) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  numDays === day && styles.dayButtonSelected,
                  isLoading && styles.dayButtonDisabled
                ]}
                onPress={() => !isLoading && setNumDays(day)}
                disabled={isLoading}
                accessibilityLabel={`Select ${day} days`}
                accessibilityState={{ selected: numDays === day }}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    numDays === day && styles.dayButtonTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            )) : null}
          </ScrollView>
          <Text style={styles.daySelectorLabelEnd}>days</Text>
        </View>
      )}

      {/* Query Input and Submit Button */}
      <View style={[styles.inputWrapper, {minHeight}]}>
        <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
          <TextInput
            style={[
              styles.inputFieldQuery,
              { 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                paddingRight: 40, 
                minHeight, 
                fontSize: 14 
              },
            ]}
            autoCorrect={false}
            placeholder="What's your goal?"
            placeholderTextColor="#888"
            value={aiQuery}
            onChangeText={handleTextChange}
            multiline
            scrollEnabled={true}
            editable={!isLoading}
            blurOnSubmit={true}
            ref={inputRef}
          />
          {/* --- Clear Button inside TextInput (commented out) --- */}
          {/* {aiQuery.length > 0 && !isLoading && (
            <TouchableOpacity
              style={styles.clearInputButton}
              onPress={() => resetModalState(false)}
              accessibilityLabel="Clear generated tasks and retry"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh-outline" size={20} color="#BBB" />
            </TouchableOpacity>
          )} */}
        </View>
        
        {isLoading ? (
          <TouchableOpacity
            style={[styles.controlButtonInInput, styles.stopButton]}
            onPress={handleStopGeneration}
            accessibilityLabel="Stop AI generation"
          >
            <View
              style={{
                width: 16,
                height: 16,
                backgroundColor: '#FFF',
                borderRadius: 3,
              }}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.controlButtonInInput,
              styles.generateButton,
              !aiQuery.trim() ? styles.generateButtonDisabled : null
            ]}
            onPress={fetchAIResponse}
            disabled={!aiQuery.trim()}
            accessibilityLabel="Generate tasks"
          >
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
      
    </View>
  );
};

export default TaskInputArea;