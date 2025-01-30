import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  RefreshControl,
  FlatList,
  useColorScheme,
} from 'react-native';
import TaskItem from '../components/taskItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/header';
import Greeting from '@/components/Greeting';
import NavBar from '@/components/Navbar';
import tasksData from '../data/tasks.json';
import Icon from 'react-native-vector-icons/Ionicons';
import FilterComponent from '@/components/FilterComponent';

// Define types for the task structure
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

// Constants for colors and styles
const LIGHT_COLORS = {
  low: '#4caf50', // green
  medium: '#ff9800', // orange
  high: '#f44336', // red
  today: '#f44336', // red
  text: '#000',
  background: '#blue',
  searchBackground: '#f1f1f1',
  placeholder: '#888',
};

const DARK_COLORS = {
  low: '#388e3c', // dark green
  medium: '#f57c00', // dark orange
  high: '#d32f2f', // dark red
  today: '#d32f2f', // dark red
  text: '#fff',
  background: '#121212',
  searchBackground: '#333',
  placeholder: '#888',
};

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const COLORS = colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const [showSearch, setShowSearch] = useState(false);
  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'completed'>('date');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'work' | 'personal' | 'school'| 'other'>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;

  const toggleSearch = useCallback(() => {
    Animated.timing(searchAnim, {
      toValue: showSearch ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowSearch((prev) => !prev);
  }, [showSearch]);

  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '75%'],
  });

  useEffect(() => {
    loadTasks();
  }, []);

  //loading Task

  const loadTasks = () => {
    try {
      if (tasksData && Array.isArray(tasksData.tasks)) {
        setTasks(tasksData.tasks);
      } else {
        throw new Error('Tasks data is not properly formatted');
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load tasks data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  //refresh

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  // Get the user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Helper function to format dates in the user's local timezone

  
  const formatLocalDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  // Get today's date in the user's local timezone
  const today = new Date();
  const todayString = formatLocalDate(today.toISOString());

  // Calculate the start and end of the current week (Monday to Sunday) in the user's local timezone
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() );

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);


  //Router routes
  const handleTaskPress = useCallback((taskId: string): void => {
    router.push(`/taskDetail?taskId=${taskId}`);
  }, [router]);

  // Function to toggle task completion

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  }, []);

  //delete task function

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  }, []);

  const getPriorityColor = useCallback((priority: 'low' | 'medium' | 'high') => {
    return COLORS[priority] || COLORS.text;
  }, [COLORS]);

  // Helper function to group tasks by date
  const groupTasksByDate = useCallback((tasks: Task[]) => {
    const groupedTasks: { [date: string]: Task[] } = {};
    tasks.forEach((task) => {
      const localDate = formatLocalDate(task.dueDate);
      if (!groupedTasks[localDate]) {
        groupedTasks[localDate] = [];
      }
      groupedTasks[localDate].push(task);
    });
    return groupedTasks;
  }, []);

  // Group tasks by date
  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);

  // Helper function to get the name of the day from a date string
  const getDayName = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }, []);

  // Filter tasks by priority
  const filteredTasksByPriority = useMemo(() => {
    if (selectedPriority === 'all') return tasks;
    return tasks.filter((task) => task.priority === selectedPriority);
  }, [tasks, selectedPriority]);

  // Filter tasks by category
  const filteredTasksByCategory = useMemo(() => {
    if (selectedCategory === 'all') return filteredTasksByPriority;
    return filteredTasksByPriority.filter((task) => task.category === selectedCategory);
  }, [filteredTasksByPriority, selectedCategory]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const tasksToSort = [...filteredTasksByCategory];
    switch (sortBy) {
      case 'date':
        return tasksToSort.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      case 'priority':
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return tasksToSort.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'completed':
        return tasksToSort.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      default:
        return tasksToSort;
    }
  }, [filteredTasksByCategory, sortBy]);

  // Filter tasks for the current week and future
  const currentWeekTasks = useMemo(
    () =>
      sortedTasks
        .filter((task) => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= startOfWeek && taskDate <= endOfWeek;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [sortedTasks, startOfWeek, endOfWeek]
  );

  const futureTasks = useMemo(
    () => sortedTasks.filter((task) => new Date(task.dueDate) > endOfWeek),
    [sortedTasks, endOfWeek]
  );

  const todayTasks = useMemo(
    () => sortedTasks.filter((task) => formatLocalDate(task.dueDate) === todayString),
    [sortedTasks, todayString]
  );

  // Filter tasks by search query
  const filteredTasks = useMemo(
    () =>
      sortedTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [sortedTasks, searchQuery]
  );

  // Task count summary
  const completedTasksCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <Header />
      <Greeting />
      <View style={styles.taskcontainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong!</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.iconsContainer}>
              <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
                {showSearch && (
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks..."
                    placeholderTextColor={COLORS.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    accessibilityLabel="Search tasks"
                  />
                )}
              </Animated.View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleSearch}
                accessibilityLabel={showSearch ? 'Close search' : 'Open search'}
              >
                <Ionicons name={showSearch ? 'close' : 'search'} size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowFilterOptions((prev) => !prev)}
                accessibilityLabel="Filter tasks"
              >
                <Ionicons name="filter" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {showFilterOptions && 
               <FilterComponent
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        colors={COLORS}
      />
            }

            <FlatList
              data={filteredTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskItem
                  task={item}
                  onPress={() => handleTaskPress(item.id)}
                  onToggleCompletion={() => toggleTaskCompletion(item.id)}
                  onDelete={() => deleteTask(item.id)}
                  priorityColor={getPriorityColor(item.priority)}
                />
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListHeaderComponent={
                <>
                  <Text style={styles.taskSummary}>
                    {tasks.length} tasks total, {completedTasksCount} completed
                  </Text>

                  {/* Display today's tasks at the top */}
                  {todayTasks.length > 0 ? (
                    <View style={styles.dateSection}>
                      <Text style={[styles.dateText, styles.todayText]}>Today</Text>
                      {todayTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onPress={() => handleTaskPress(task.id)}
                          onToggleCompletion={() => toggleTaskCompletion(task.id)}
                          onDelete={() => deleteTask(task.id)}
                          priorityColor={getPriorityColor(task.priority)}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.dateSection}>
                      <Text style={[styles.dateText, styles.todayText]}>Today</Text>
                      <View style={styles.emptyStateContainer}>
                        <Icon name="md-checkmark-circle-outline" size={50} color="#000" />
                        <Text style={styles.emptyStateText}>No tasks for today!</Text>
                      </View>
                    </View>
                  )}

                  {currentWeekTasks.length > 0 ? (
                    currentWeekTasks.map((task) => (
                      <View key={task.dueDate} style={styles.dateSection}>
                        <Text style={[styles.dateText, formatLocalDate(task.dueDate) === todayString && styles.todayText]}>
                          {formatLocalDate(task.dueDate) === todayString ? 'Today' : getDayName(task.dueDate)}
                        </Text>
                        <TaskItem
                          key={task.id}
                          task={task}
                          onPress={() => handleTaskPress(task.id)}
                          onToggleCompletion={() => toggleTaskCompletion(task.id)}
                          onDelete={() => deleteTask(task.id)}
                          priorityColor={getPriorityColor(task.priority)}
                        />
                      </View>
                    ))
                  ) : (
                    <View style={styles.dateSection}>
                      <View style={styles.emptyStateContainer}>
                        <Icon name="md-checkmark-circle-outline" size={50} color="#000" />
                        <Text style={styles.emptyStateText}>No tasks for this week!</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.futureSection}>
                    <TouchableOpacity
                      onPress={() => setShowFutureTasks(!showFutureTasks)}
                      accessibilityLabel={showFutureTasks ? 'Hide future tasks' : 'Show future tasks'}
                    >
                      <Text style={styles.futureHeader}>
                        Future Tasks{' '}
                        {showFutureTasks ? (
                          <Ionicons name="chevron-up" size={18} color={COLORS.text} />
                        ) : (
                          <Ionicons name="chevron-down" size={18} color={COLORS.text} />
                        )}
                      </Text>
                    </TouchableOpacity>
                    {showFutureTasks && (
                      futureTasks.length > 0 ? (
                        futureTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onPress={() => handleTaskPress(task.id)}
                            onToggleCompletion={() => toggleTaskCompletion(task.id)}
                            onDelete={() => deleteTask(task.id)}
                            priorityColor={getPriorityColor(task.priority)}
                          />
                        ))
                      ) : (
                        <View style={styles.emptyStateContainer}>
                          <Icon name="md-checkmark-circle-outline" size={50} color={COLORS.text} />
                          <Text style={styles.emptyStateText}>No future tasks!</Text>
                        </View>
                      )
                    )}
                  </View>
                </>
              }
            />
          </>
        )}
        <NavBar />  
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskcontainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Ensure space for the navbar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  todayText: {
    color: '#f44336',
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 40,
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#f44336',
  },
  searchContainer: {
    overflow: 'hidden',
    height: 40,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    fontSize: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
  },
  futureSection: {
    marginBottom: 20,
  },
  futureHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  priorityFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 16,
    color: '#000',  // Default text color
  },
  selectedCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',  // Red color for the selected category
  },
  priorityText: {
    fontSize: 16,
  },
  selectedPriority: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',  // Red color for the selected priority
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  sortText: {
    fontSize: 16,
    marginRight: 10,
  },
  selectedSort: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336', // Red for selected sort option
    marginRight: 10,
  },
  taskSummary: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: '#f44336', // Red for retry text
    fontSize: 16,
    marginTop: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
export default HomeScreen;