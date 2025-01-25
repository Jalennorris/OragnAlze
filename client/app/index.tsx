import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import TaskItem from '../components/taskItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/header'
import Greeting from '@/components/Greeting';
import NavBar from '@/components/Navbar';


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
  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Task 1', description: 'Task 1 description', dueDate: '2025-01-20', completed: false, priority: 'medium' },
    { id: '2', title: 'Task 2', description: 'Task 2 description', dueDate: '2025-01-21', completed: false, priority: 'high' },
    { id: '3', title: 'Task 3', description: 'Task 3 description', dueDate: '2025-01-22', completed: false, priority: 'low' },
    { id: '4', title: 'Task 4', description: 'Task 4 description', dueDate: '2025-01-23', completed: false, priority: 'medium' },
    { id: '5', title: 'Task 5', description: 'Task 5 description', dueDate: '2025-01-24', completed: false, priority: 'high' },
    { id: '5', title: 'Task 5', description: 'Task 5 description', dueDate: '2025-01-24', completed: false, priority: 'high' },
    { id: '6', title: 'Task 6', description: 'Task 6 description', dueDate: '2025-01-25', completed: false, priority: 'low' },
    { id: '17', title: 'Task 17', description: 'Task 6 description', dueDate: '2025-01-25', completed: false, priority: 'low' },
    { id: '7', title: 'Task 7', description: 'Task 7 description', dueDate: '2025-01-26', completed: false, priority: 'medium' },
    { id: '8', title: 'Task 8', description: 'Task 8 description', dueDate: '2025-02-02', completed: false, priority: 'high' },
    { id: '9', title: 'Task 9', description: 'Task 9 description', dueDate: '2025-02-10', completed: false, priority: 'low' },
    { id: '10', title: 'Task 10', description: 'Task 10 description', dueDate: '2025-02-15', completed: false, priority: 'medium' },
    { id: '11', title: 'Task 11', description: 'Task 11 description', dueDate: '2025-02-20', completed: false, priority: 'high' },
    { id: '12', title: 'Task 12', description: 'Task 12 description', dueDate: '2025-03-01', completed: false, priority: 'low' },
    { id: '13', title: 'Task 13', description: 'Task 13 description', dueDate: '2025-03-05', completed: false, priority: 'medium' },
    { id: '14', title: 'Task 14', description: 'Task 14 description', dueDate: '2025-03-10', completed: false, priority: 'high' },
    { id: '15', title: 'Task 15', description: 'Task 15 description', dueDate: '2025-03-15', completed: false, priority: 'low' },
  ]);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

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
  const currentWeekTasks = tasks.filter(task => new Date(task.dueDate) >= today && new Date(task.dueDate) <= new Date('2025-01-26'));
  const futureTasks = tasks.filter(task => new Date(task.dueDate) > new Date('2025-01-26'));

  return (
    <View style={styles.container}>
      <Header/>
      <Greeting/>
    <View style={styles.taskcontainer}>
     
      <ScrollView>
        {currentWeekTasks.map(task => (
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
        ))}
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

      <BottomNavBar />
    </View>
    </View>
  );
};

const BottomNavBar: React.FC = () => {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    router.push(screen);
  };

  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => handleNavigate('/')} style={styles.navItem}>
        <Ionicons name="home-outline" size={30} color="black" />
      
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/addTaskScreen')} style={styles.navItem}>
        <Ionicons name="add-circle-outline" size={30} color="black" />
    
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('/calendarScreen')} style={styles.navItem}>
        <Ionicons name="calendar-outline" size={30} color="black" />
       
      </TouchableOpacity>
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 70,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow effect
  },
  navItem: {
    alignItems: 'center',
    padding: 10,
  
  },
  navText: {
    fontSize: 14,
    color: 'black',
    marginTop: 4,
  },
});

export default HomeScreen;