import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Animated } from 'react-native';
import TaskItem from '../components/taskItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/header';
import Greeting from '@/components/Greeting';
import NavBar from '@/components/Navbar';
import tasksData from '../data/tasks.json';

// Define types for the task structure
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const searchAnim = useRef(new Animated.Value(0)).current;

  const toggleSearch = () => {
    Animated.timing(searchAnim, {
      toValue: showSearch ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowSearch((prev) => !prev);
  };

  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '75%'],
  });

  useEffect(() => {
    if (tasksData && Array.isArray(tasksData.tasks)) {
      setTasks(tasksData.tasks);
      setLoading(false);
    } else {
      setLoading(false);
      setError('Failed to load tasks data');
      console.error('tasksData is not properly formatted', tasksData);
    }
  }, []);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  // Calculate the start and end of the current week (Monday to Sunday)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const handleTaskPress = (taskId: string): void => {
    router.push(`/taskDetail?taskId=${taskId}`);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low':
        return '#4caf50'; // green
      case 'medium':
        return '#ff9800'; // orange
      case 'high':
        return '#f44336'; // red
      default:
        return '#000';
    }
  };

  // Helper function to group tasks by date
  const groupTasksByDate = (tasks: Task[]) => {
    const groupedTasks: { [date: string]: Task[] } = {};
    tasks.forEach(task => {
      if (!groupedTasks[task.dueDate]) {
        groupedTasks[task.dueDate] = [];
      }
      groupedTasks[task.dueDate].push(task);
    });
    return groupedTasks;
  };

  // Group tasks by date
  const groupedTasks = groupTasksByDate(tasks);

  // Helper function to get the name of the day from a date string
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Filter tasks for the current week and future
  const currentWeekTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= startOfWeek && taskDate <= endOfWeek;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const futureTasks = tasks.filter(task => new Date(task.dueDate) > endOfWeek);

  const todayTasks = tasks.filter(task => task.dueDate === todayString);

  // Filter tasks by search query
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header />
      <Greeting />
      <View style={styles.taskcontainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView>
            <View style={styles.iconsContainer}>
              <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
                {showSearch && (
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                )}
              </Animated.View>
              <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
                <Ionicons
                  name={showSearch ? "close" : "search"}
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
            
            {/* Display today's tasks at the top */}
            {todayTasks.length > 0 ? (
              <View style={styles.dateSection}>
                <Text style={[styles.dateText, styles.todayText]}>Today</Text>
                {todayTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onPress={() => handleTaskPress(task.id)}
                    onToggleCompletion={() => toggleTaskCompletion(task.id)}
                    priorityColor={getPriorityColor(task.priority)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.dateSection}>
                <Text style={[styles.dateText, styles.todayText]}>Today</Text>
                <Text style={styles.noTasksText}>No tasks for today!</Text>
              </View>
            )}

            {currentWeekTasks.length > 0 ? currentWeekTasks.map(task => (
              <View key={task.dueDate} style={styles.dateSection}>
                <Text style={[styles.dateText, task.dueDate === todayString && styles.todayText]}>
                  {task.dueDate === todayString ? 'Today' : getDayName(task.dueDate)}
                </Text>
                <TaskItem
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task.id)}
                  onToggleCompletion={() => toggleTaskCompletion(task.id)}
                  priorityColor={getPriorityColor(task.priority)}
                />
              </View>
            )) : (
              <View style={styles.dateSection}>
                <Text style={styles.noTasksText}>No tasks for this week!</Text>
              </View>
            )}

            <View style={styles.futureSection}>
              <TouchableOpacity onPress={() => setShowFutureTasks(!showFutureTasks)}>
                <Text style={styles.futureHeader}>
                  Future Tasks {showFutureTasks ? <Ionicons name="chevron-up" size={18} color="black" /> : <Ionicons name="chevron-down" size={18} color="black" />}
                </Text>
              </TouchableOpacity>
              {showFutureTasks && futureTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task.id)}
                  onToggleCompletion={() => toggleTaskCompletion(task.id)}
                  priorityColor={getPriorityColor(task.priority)}
                />
              ))}
            </View>
          </ScrollView>
        )}
        <NavBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  taskcontainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Ensure space for the navbar
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
  todayText: {
    color: '#f44336', // Red color for "Today"
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 40,
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'red',
  },
  searchContainer: {
    overflow: "hidden",
    height: 40,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  searchInput: {
    fontSize: 16,
    color: "#000",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    color: 'black',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default HomeScreen;