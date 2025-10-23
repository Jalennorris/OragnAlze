import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, FlatList, AppState } from 'react-native';
import TaskItem from './taskItem';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from './EmptyState';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for the task structure
interface Task {
  taskId: number;
  taskName: string;
  taskDescription: string;
  estimatedDuration: number;
  deadline: string;
  completed: boolean;
  status: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

interface FutureTaskProps {
  futureTasks: Task[];
  showFutureTasks: boolean;
  setShowFutureTasks: React.Dispatch<React.SetStateAction<boolean>>;
  handleTaskPress: (taskId: string) => void;
  toggleTaskCompletion: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  colors: { [key: string]: string };
}

const DARK_COLORS = {
  text: '#f1f5f9',
  background: '#181c22',
  card: '#23272f',
  border: '#23232b',
};

const FutureTask: React.FC<FutureTaskProps> = ({
  futureTasks,
  showFutureTasks,
  setShowFutureTasks,
  handleTaskPress,
  toggleTaskCompletion,
  deleteTask,
  getPriorityColor,
  colors,
}) => {
  // Animation state
  const [heightAnim] = React.useState(new Animated.Value(showFutureTasks ? 1 : 0));
  const [darkMode, setDarkMode] = React.useState(false);

  const fetchDarkMode = React.useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('darkMode');
      if (stored !== null) {
        setDarkMode(JSON.parse(stored));
      }
    } catch {
      setDarkMode(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDarkMode();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchDarkMode();
    });
    return () => sub.remove();
  }, [fetchDarkMode]);

  const mergedColors = darkMode ? { ...colors, ...DARK_COLORS } : colors;

  React.useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: showFutureTasks ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFutureTasks, heightAnim]);

  // Interpolate height for animation based on list size (capped)
  const maxHeight = Math.min(Math.max(futureTasks.length, 1) * 72, 500);
  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });

  return (
    <View style={styles.futureSection}>
      <TouchableOpacity
        onPress={() => setShowFutureTasks(!showFutureTasks)}
        accessibilityLabel={showFutureTasks ? 'Hide future tasks' : 'Show future tasks'}
        accessibilityHint="Toggles the visibility of future tasks"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
          
          <Text style={[styles.futureHeader, { color: mergedColors.text, paddingHorizontal: 0 }]}>
            {'  '}Future Tasks
            {showFutureTasks ? (
            <Icon name="chevron-up" size={18} color={mergedColors.text} />
          ) : (
            <Icon name="chevron-down" size={18} color={mergedColors.text} />
          )}
          </Text>
        </View>
      </TouchableOpacity>
      <Animated.View style={{ overflow: 'hidden', height: animatedHeight }}>
        {showFutureTasks && (
          <FlatList
            data={futureTasks}
            keyExtractor={(item) => item.taskId.toString()}
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                onPress={() => handleTaskPress(item.taskId.toString())}
                onToggleCompletion={() => toggleTaskCompletion(item.taskId)}
                onDelete={() => deleteTask(item.taskId)}
                priorityColor={getPriorityColor(item.priority)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                message="No future tasks! Try adding tasks with upcoming deadlines."
                iconName="calendar-outline"
                colors={mergedColors}
              />
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  futureSection: {
    marginBottom: 20,
    padding: 15, // Add padding for better spacing
  },
  futureHeader: {
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'left', // fixed: 'flex-start' is invalid for textAlign
    marginBottom: 10,
    paddingHorizontal: 15, // Add padding for better alignment
    right: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FutureTask;
