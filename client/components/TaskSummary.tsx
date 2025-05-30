import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';

/**
 * Defines the customizable color palette for the TaskSummary component.
 */
interface TaskSummaryThemeColors {
  /** Color for all text elements. */
  text: string;
  /** Fill color for the progress bar indicating completed tasks. */
  progressFill: string;
  /** Background color for the track of the progress bar. */
  progressBackground: string;
  /** Optional background color for the entire summary container. Defaults to transparent. */
  containerBackground?: string;
}

/**
 * Props for the TaskSummary component.
 */
interface TaskSummaryProps {
  /** The total number of tasks. */
  totalTasks: number;
  /** The number of tasks that have been completed. */
  completedTasks: number;
  /**
   * Custom theme colors for the component.
   * Allows overriding parts or all of the default theme.
   */
  theme?: Partial<TaskSummaryThemeColors>;
  /**
   * Base font size for the summary and percentage text elements.
   * Defaults to 14. Percentage text will be slightly smaller.
   */
  textSize?: number;
  /**
   * Text alignment for the summary and percentage text.
   * Defaults to 'center'.
   */
  textAlign?: 'left' | 'center' | 'right';
  /** Custom style to be applied to the main container View. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom style for the summary text (e.g., "10 tasks total, 5 completed"). */
  summaryTextStyle?: StyleProp<TextStyle>;
  /** Custom style for the percentage text (e.g., "50%"). */
  percentTextStyle?: StyleProp<TextStyle>;
  /** Custom style for the ProgressBar component's container. */
  progressBarStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_THEME: TaskSummaryThemeColors = {
  text: '#333333', // Dark gray for better readability
  progressFill: '#007AFF', // Standard vibrant blue for progress
  progressBackground: '#E0E0E0', // Light gray for progress track
  containerBackground: 'transparent', // Default to no background for flexibility
};

/**
 * TaskSummary is a React Native component that displays a summary of tasks,
 * including the total number of tasks, completed tasks, and a progress bar
 * showing the completion percentage.
 */
const TaskSummary: React.FC<TaskSummaryProps> = ({
  totalTasks,
  completedTasks,
  theme,
  textSize = 14,
  textAlign = 'center',
  containerStyle,
  summaryTextStyle,
  percentTextStyle,
  progressBarStyle,
}) => {
  const mergedColors = { ...DEFAULT_THEME, ...theme };

  // Ensure completedTasks is not greater than totalTasks and both are non-negative.
  const validTotalTasks = Math.max(0, totalTasks);
  const validCompletedTasks = Math.max(
    0,
    Math.min(completedTasks, validTotalTasks)
  );

  const completionRate =
    validTotalTasks > 0 ? validCompletedTasks / validTotalTasks : 0;
  const percentage = Math.round(completionRate * 100);

  const summaryText =
    validTotalTasks > 0
      ? `${validTotalTasks} tasks total, ${validCompletedTasks} completed`
      : 'No tasks available';

  const accessibilitySummary =
    validTotalTasks > 0
      ? `Summary: ${validTotalTasks} tasks in total, ${validCompletedTasks} completed. Progress: ${percentage} percent.`
      : 'Task summary: No tasks available.';

  // Animated progress bar
  const animatedWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: mergedColors.containerBackground },
        containerStyle,
      ]}
      accessibilityLabel={accessibilitySummary}
      accessible // Makes the entire view a single accessible element for screen readers
    >
      <Text
        style={[
          styles.summaryText, // Renamed from styles.text for clarity
          {
            color: mergedColors.text,
            fontSize: textSize,
            textAlign: textAlign,
          },
          summaryTextStyle,
        ]}
        // Individual text elements are not made accessible if the parent View
        // provides a comprehensive accessibilityLabel.
      >
        {summaryText}
      </Text>
      {/* Enhanced Custom Progress Bar */}
      <View
        style={[
          styles.progressBarContainer,
          progressBarStyle,
          { backgroundColor: mergedColors.progressBackground },
        ]}
        accessible={false}
      >
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: mergedColors.progressFill,
              shadowColor: mergedColors.progressFill,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
        <View style={styles.progressBarPercentOverlayWrapper} pointerEvents="none">
          <Text
            style={[
              styles.progressBarPercentOverlay,
              {
                color: mergedColors.text,
                fontSize: textSize * 0.85,
              },
            ]}
            accessibilityElementsHidden
          >
            {`${percentage}%`}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.percentText,
          {
            color: mergedColors.text,
            fontSize: textSize * 0.9, // Percentage text slightly smaller
            textAlign: textAlign,
          },
          percentTextStyle,
        ]}
        accessibilityLabel={`Progress: ${percentage} percent completed`}
      >
        {`${percentage}%`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16, // Standardized padding
    paddingVertical: 12,   // Standardized padding
    marginBottom: 20,      // Spacing below the component
  },
  summaryText: {
    // Default fontSize and textAlign are applied dynamically from props
    marginBottom: 10, // Increased spacing for visual separation
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#E0E0E0', // fallback, will be overridden by theme
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 9,
  },
  progressBarPercentOverlayWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  progressBarPercentOverlay: {
    fontWeight: '600',
    opacity: 0.85,
    backgroundColor: 'transparent',
  },
  percentText: {
    // Default fontSize and textAlign are applied dynamically from props
    marginTop: 6,           // Spacing above the percentage text
    fontWeight: '500',
  },
});

export default TaskSummary;