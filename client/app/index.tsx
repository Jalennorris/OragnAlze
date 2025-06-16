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
import AsyncStorage from '@react-native-async-storage/async-storage';
import MotivationalQuotes from '@/components/MotivationalQoutes';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import jwtDecode from 'jwt-decode'; // Import JWT decode library
import { useFocusEffect } from '@react-navigation/native'; // Add this import

// Define types for the task structure
interface Task {
  taskId: number; // Use 'number' instead of 'Number'
  userId: number; // Use 'number' instead of 'Number'
  taskName: string;
  taskDescription: string;
  estimatedDuration: number; // Use 'number' instead of 'Number'
  deadline: string;
  completed: boolean;
  status: string;
  createdAt: Date;
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
  background: '#fff', // light blue
  searchBackground: '#f1f1f1',
  placeholder: '#888',
};

const DARK_COLORS = {
  low: '#388e3c', // dark green
  medium: '#f57c00', // dark orange
  high: '#d32f2f', // dark red
  today: '#d32f2f', // dark red
  text: '#feefe9',
  background: '#121212',
  searchBackground: '#333',
  placeholder: '#888',
};

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  console.log(colorScheme)
  const COLORS = colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  const [showSearch, setShowSearch] = useState(false);
  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [data, setData] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'completed'>('date');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'work' | 'personal' | 'school'| 'other'>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // New state for authentication
  const [showAllTasks, setShowAllTasks] = useState(false); // Add state for All Tasks section
  
  const searchAnim = useRef(new Animated.Value(0)).current;

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error("No auth token found. Redirecting to login...");
        router.push('/login');
        return;
      }

      const decodedToken: any = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.error("Auth token expired. Redirecting to login...");
        await AsyncStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error("Error during authentication check:", err);
      router.push('/login');
    }
  };

  const getTasks = async () => {
    try {
      console.log('Fetching userId from AsyncStorage...');
      const userId = await AsyncStorage.getItem('userId'); // Await is needed
  
      if (!userId) {
        console.error("User ID not found in AsyncStorage. Redirecting to login...");
        router.push('/login'); // Redirect before throwing error
        throw new Error("User ID not found in AsyncStorage");
      }
      
      console.log(`User ID retrieved: ${userId}`);
      console.log(`Fetching tasks from: http://localhost:8080/api/tasks/user/${userId}`);
  
      const response = await fetch(`http://localhost:8080/api/tasks/user/${userId}`);
  
      console.log(`Response status: ${response.status}`);
  
      if (!response.ok) {
        console.error(`HTTP Error! Status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Raw response JSON:', JSON.stringify(data, null, 2));
  
      setData(data);
      console.log('Data successfully stored in state.');
  
      loadTasks(data);
      console.log('loadTasks function executed with fetched data.');
  
    } catch (err) {
      setError(err.message);
      console.error('Failed to load tasks:', err);
    } finally {
      console.log('getTasks execution completed.');
      setLoading(false);
    }
  };

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
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getTasks();
    }
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        getTasks();
      }
    }, [isAuthenticated])
  );

  //loading Task

  const loadTasks = (tasksData?: Task[]) => {
    try {
      if (tasksData && Array.isArray(tasksData)) {
        setTasks(tasksData);
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
    try {
      if (!dateString) {
        console.error('❌ Error: dateString is null or undefined');
        return 'Invalid Date';
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error(`❌ Error: Invalid date received: ${dateString}`);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });
    } catch (err) {
      console.error('❌ Error formatting date:', err);
      return 'Invalid Date';
    }
  };
  
  // Get today's date in the user's local timezone
  const today = new Date();
  console.log('Today:', today.toDateString());
  const todayString = today.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });
  console.log('Today in local timezone:', todayString);
  
  // Calculate the start and end of the current week (Monday to Sunday)
  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  console.log('Start of the week:', startOfWeek.toDateString());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  console.log('End of week:', endOfWeek.toDateString());



  //Router routes
  //
  const handleTaskPress = useCallback((taskId: string): void => {
    router.push(`/taskDetail?taskId=${taskId}`);
  }, [router]);

  // Function to toggle task completion
  const toggleTaskCompletion = useCallback((taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.taskId === taskId ? { ...task, completed: !task.completed } : task))
    );
  }, []);

  //delete task function
  const deleteTask = useCallback((taskId: number) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.taskId !== taskId));
  }, []);

  //priority color function
  const getPriorityColor = useCallback((priority: 'low' | 'medium' | 'high') => {
    return COLORS[priority] || COLORS.text;
  }, [COLORS]);

  // Helper function to group tasks by date
  const groupTasksByDate = useCallback((tasks: Task[]) => {
    const groupedTasks: { today: Task[]; week: { [date: string]: Task[] } } = {
      today: [],
      week: {},
    };
  
    tasks.forEach((task) => {
      const localDate = formatLocalDate(task.deadline);
  
      if (localDate === todayString) {
        groupedTasks.today.push(task);
      } else if (new Date(task.deadline) >= startOfWeek && new Date(task.deadline) <= endOfWeek) {
        if (!groupedTasks.week[localDate]) {
          groupedTasks.week[localDate] = [];
        }
        groupedTasks.week[localDate].push(task);
      }
    });
  
    return groupedTasks;
  }, [todayString, startOfWeek, endOfWeek]);
  
  // Group tasks by date
  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);

  //memo**
  

  // Helper function to get the name of the day from a date string
  const getDayName = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return 'Invalid Date';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    //0-6
    return days[date.getDay()];
    // get day 0-6 sun-satin2
    //getDay
  }, []);

  // Filter tasks by priority
  const filteredTasksByPriority = useMemo(() => {
    if (!tasks) return [];
    if (selectedPriority === 'all') return tasks;
    return tasks.filter((task) => task.priority === selectedPriority);
  }, [tasks, selectedPriority]);

  // Filter tasks by category
  const filteredTasksByCategory = useMemo(() => {
    if (!filteredTasksByPriority) return [];
    if (selectedCategory === 'all') return filteredTasksByPriority;
    return filteredTasksByPriority.filter((task) => task.category === selectedCategory);
  }, [filteredTasksByPriority, selectedCategory]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    if (!filteredTasksByCategory) return [];
    const tasksToSort = Array.isArray(filteredTasksByCategory) ? [...filteredTasksByCategory] : [];
    switch (sortBy) {
      case 'date':
        return tasksToSort.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
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
  const currentWeekTasks = useMemo(() => {
    //is no sortTask return empty array
    if (!sortedTasks) return [];
    
    return Array.isArray(sortedTasks)
      ? sortedTasks
          .filter((task) => {

            const taskDate = new Date(task.deadline);
            return taskDate >= startOfWeek && taskDate <= endOfWeek;
          })
          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      : [];
  }, [sortedTasks, startOfWeek, endOfWeek]);

  const futureTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks) ? sortedTasks.filter((task) => new Date(task.deadline) > endOfWeek) : [];
  }, [sortedTasks, endOfWeek]);
  // Filter tasks for today
  const todayTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks) ? sortedTasks.filter((task) => formatLocalDate(task.deadline) === todayString) : [];
  }, [sortedTasks, todayString]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks)
      ? sortedTasks.filter(
          (task) =>
            task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.taskDescription.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];
  }, [sortedTasks, searchQuery]);

  // Task count summary
  const completedTasksCount = useMemo(() => (Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0), [tasks]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
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
                              key={task.taskId}
                              task={task}
                              onPress={() => handleTaskPress(task.taskId.toString())}
                              onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                              onDelete={() => deleteTask(task.taskId)}
                              priorityColor={getPriorityColor(task.priority)}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.dateSection}>
                          <Text style={[styles.dateText, styles.todayText]}>Today</Text>
                          <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateText}>No tasks for today!</Text>
                            <MotivationalQuotes/>
                          </View>
                        </View>
                      )}
                        {/* Display tasks for the current week */
                        
                        
                        
                        }
                      {currentWeekTasks.length > 0 ? (
                        currentWeekTasks.map((task) => (
                          <View key={task.taskId.toString()} style={styles.dateSection}>
                            <Text style={[styles.dateText, formatLocalDate(task.deadline) === todayString && styles.todayText]}>
              
                              {formatLocalDate(task.deadline) === todayString ? 'Today' : getDayName(task.deadline)}
                            </Text>
                            <TaskItem
                              key={task.taskId.toString()}
                              task={task}
                              onPress={() => handleTaskPress(task.taskId.toString())}
                              onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                              onDelete={() => deleteTask(task.taskId)}
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
                                key={task.taskId.toString()}
                                task={task}
                                onPress={() => handleTaskPress(task.taskId.toString())}
                                onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                                onDelete={() => deleteTask(task.taskId)}
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
                {/* --- All Tasks Section at the end, styled like Future Tasks --- */}
                <View style={styles.futureSection}>
                  <TouchableOpacity
                    onPress={() => setShowAllTasks(!showAllTasks)}
                    accessibilityLabel={showAllTasks ? 'Hide all tasks' : 'Show all tasks'}
                  >
                    <Text style={styles.futureHeader}>
                      All Tasks{' '}
                      {showAllTasks ? (
                        <Ionicons name="chevron-up" size={18} color={COLORS.text} />
                      ) : (
                        <Ionicons name="chevron-down" size={18} color={COLORS.text} />
                      )}
                    </Text>
                  </TouchableOpacity>
                  {showAllTasks && (
                    tasks.length > 0 ? (
                      tasks.map((task) => (
                        <TaskItem
                          key={task.taskId.toString()}
                          task={task}
                          onPress={() => handleTaskPress(task.taskId.toString())}
                          onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                          onDelete={() => deleteTask(task.taskId)}
                          priorityColor={getPriorityColor(task.priority)}
                        />
                      ))
                    ) : (
                      <View style={styles.emptyStateContainer}>
                        <Icon name="md-checkmark-circle-outline" size={50} color={COLORS.text} />
                        <Text style={styles.emptyStateText}>No tasks found!</Text>
                      </View>
                    )
                  )}
                </View>
              </>
            )}
            <NavBar />  
          </View>
        </View>
      )}
    </GestureHandlerRootView>
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
  allTasksSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  allTasksHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#6a11cb',
  },
});
export default HomeScreen;