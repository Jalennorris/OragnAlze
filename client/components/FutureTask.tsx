import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, FlatList } from 'react-native';
import TaskItem from '../components/taskItem';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '../components/EmptyState';
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

  React.useEffect(() => {
    const fetchDarkMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('darkMode');
        if (stored !== null) {
          setDarkMode(JSON.parse(stored));
        }
      } catch {
        setDarkMode(false);
      }
    };
    fetchDarkMode();
    const interval = setInterval(fetchDarkMode, 1000);
    return () => clearInterval(interval);
  }, []);

  const mergedColors = darkMode ? { ...colors, ...DARK_COLORS } : colors;

  React.useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: showFutureTasks ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFutureTasks]);

  // Interpolate height for animation (adjust maxHeight as needed)
  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // 500 is an example max height, adjust as needed
  });

  return (
    <View style={styles.futureSection}>
      <TouchableOpacity
        onPress={() => setShowFutureTasks(!showFutureTasks)}
        accessibilityLabel={showFutureTasks ? 'Hide future tasks' : 'Show future tasks'}
        accessibilityHint="Toggles the visibility of future tasks"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
          {showFutureTasks ? (
            <Icon name="chevron-up" size={18} color={mergedColors.text} />
          ) : (
            <Icon name="chevron-down" size={18} color={mergedColors.text} />
          )}
          <Text style={[styles.futureHeader, { color: mergedColors.text, paddingHorizontal: 0 }]}>
            {'  '}Future Tasks
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
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 15, // Add padding for better alignment
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
