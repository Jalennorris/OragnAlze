import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Optional: Remove if not using Expo

interface TaskSummaryThemeColors {
  text: string;
  progressFill: string;
  progressBackground: string;
  containerBackground?: string;
  cardShadow?: string;
}

interface TaskSummaryProps {
  totalTasks: number;
  completedTasks: number;
  theme?: Partial<TaskSummaryThemeColors>;
  textSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  containerStyle?: StyleProp<ViewStyle>;
  summaryTextStyle?: StyleProp<TextStyle>;
  percentTextStyle?: StyleProp<TextStyle>;
  progressBarStyle?: StyleProp<ViewStyle>;
  rounded?: boolean;
  shadow?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  iconName?: string; // e.g., "checkmark-done"
  iconColor?: string;
  iconSize?: number;
}

const DEFAULT_THEME: TaskSummaryThemeColors = {
  text: '#222',
  progressFill: '#4F8EF7',
  progressBackground: '#F0F1F3',
  containerBackground: '#fff',
  cardShadow: '#000',
};

const TaskSummary: React.FC<TaskSummaryProps> = ({
  totalTasks,
  completedTasks,
  theme,
  textSize = 16,
  textAlign = 'center',
  containerStyle,
  summaryTextStyle,
  percentTextStyle,
  progressBarStyle,
  rounded = true,
  shadow = true,
  onPress,
  iconName,
  iconColor,
  iconSize = 22,
}) => {
  const mergedColors = { ...DEFAULT_THEME, ...theme };

  // Memoize derived values
  const { validTotalTasks, validCompletedTasks, completionRate, percentage, summaryText, accessibilitySummary } = useMemo(() => {
    const validTotalTasks = Math.max(0, totalTasks);
    const validCompletedTasks = Math.max(0, Math.min(completedTasks, validTotalTasks));
    const completionRate = validTotalTasks > 0 ? validCompletedTasks / validTotalTasks : 0;
    const percentage = Math.round(completionRate * 100);
    const summaryText =
      validTotalTasks > 0
        ? `${validTotalTasks} tasks • ${validCompletedTasks} completed`
        : 'No tasks available';
    const accessibilitySummary =
      validTotalTasks > 0
        ? `Summary: ${validTotalTasks} tasks in total, ${validCompletedTasks} completed. Progress: ${percentage} percent.`
        : 'Task summary: No tasks available.';
    return { validTotalTasks, validCompletedTasks, completionRate, percentage, summaryText, accessibilitySummary };
  }, [totalTasks, completedTasks]);

  // Animated progress bar
  const animatedWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const Container = onPress ? Pressable : View;

  return (
    <Container
      style={[
        styles.container,
        {
          backgroundColor: mergedColors.containerBackground,
          borderRadius: rounded ? 18 : 6,
          ...(shadow
            ? {
                shadowColor: mergedColors.cardShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 4,
              }
            : {}),
        },
        containerStyle,
      ]}
      accessibilityLabel={accessibilitySummary}
      accessible
      onPress={onPress}
      android_ripple={onPress ? { color: '#e0e0e0' } : undefined}
    >
      <View style={styles.headerRow}>
        {iconName ? (
          <Ionicons
            name={iconName as any}
            size={iconSize}
            color={iconColor || mergedColors.progressFill}
            style={{ marginRight: 8 }}
            accessibilityElementsHidden
          />
        ) : null}
        <Text
          style={[
            styles.summaryText,
            {
              color: mergedColors.text,
              fontSize: textSize,
              textAlign: textAlign,
            },
            summaryTextStyle,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {summaryText}
        </Text>
      </View>
      <View
        style={[
          styles.progressBarContainer,
          progressBarStyle,
          {
            backgroundColor: mergedColors.progressBackground,
            borderRadius: rounded ? 9 : 4,
          },
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
              borderRadius: rounded ? 9 : 4,
              // Gradient effect using opacity overlay
              opacity: 0.95,
            },
          ]}
        >
          {/* Optional: Add a gradient overlay here if using a gradient library */}
        </Animated.View>
        <View style={styles.progressBarPercentOverlayWrapper} pointerEvents="none">
          <Text
            style={[
              styles.progressBarPercentOverlay,
              {
                color: mergedColors.text,
                fontSize: textSize * 0.95,
                fontWeight: 'bold',
                textShadowColor: 'rgba(255,255,255,0.7)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              },
            ]}
            accessibilityElementsHidden
          >
            {`${percentage}%`}
          </Text>
        </View>
      </View>
      {/* Removed the bottom percentText for a cleaner, modern look */}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
    minWidth: 220,
    // borderRadius and shadow handled dynamically
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 28,
  },
  summaryText: {
    fontWeight: '600',
    flexShrink: 1,
    letterSpacing: 0.1,
  },
  progressBarContainer: {
    height: 22,
    overflow: 'hidden',
    marginVertical: 8,
    justifyContent: 'center',
    position: 'relative',
    // borderRadius handled dynamically
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    // borderRadius handled dynamically
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
    fontWeight: '700',
    opacity: 0.97,
    backgroundColor: 'transparent',
    letterSpacing: 0.3,
  },
  // percentText removed
});

export default TaskSummary;