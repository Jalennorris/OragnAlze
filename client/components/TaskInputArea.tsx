import React from 'react';
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

const TaskInputArea = ({
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
}: any) => {
  return (
    <View style={styles.inputArea}>
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
          {Array.isArray(SHORTCUTS) ? SHORTCUTS.map((sc: any, idx: number) => (
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
                style={{ marginRight: 0 }}
              />
            </TouchableOpacity>
          )) : null}
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
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.inputFieldQuery}
          placeholder="What's your goal?"
          placeholderTextColor="#888"
          value={aiQuery}
          onChangeText={setAiQuery}
          multiline
          editable={!isLoading}
          blurOnSubmit={true}
          ref={inputRef}
        />
        {isLoading ? (
          <TouchableOpacity
            style={[styles.controlButtonInInput, styles.stopButton]}
            onPress={handleStopGeneration}
            accessibilityLabel="Stop AI generation"
          >
            <Ionicons name="stop-circle" size={24} color="#FFF" />
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
      <GoalSuggestionAlgorithm
        userGoals={Array.isArray(userHistory.goals) ? userHistory.goals : []}
        allGoals={Array.isArray(allGoals) ? allGoals : []}
        query={aiQuery}
        onSuggestionPress={handleGoalSuggestionSelect}
      />
      {aiQuery.trim().length > 0 && (
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
      )}
      <View style={styles.actionButtonsContainer}>
        {suggestedTasks.length > 0 && !isLoading && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={() => resetModalState(false)}
              accessibilityLabel="Clear generated tasks and retry"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFF" style={{ marginRight: 5 }} />
              <Text style={styles.actionButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptAllButton]}
              onPress={handleAcceptAllTasks}
              accessibilityLabel="Accept all tasks"
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#FFF" style={{ marginRight: 5 }} />
              <Text style={styles.actionButtonText}>Accept All</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default TaskInputArea;
