import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const[error, setError] = useState("");
  const[loading, setLoading] = useState(true);


  useEffect(() => {
    if (tasksData && Array.isArray(tasksData.tasks)) {
      setTasks(tasksData.tasks);
    } else {
      setLoading(false);
      setError('Failed to load tasks data');
      console.error('tasksData is not properly formatted', tasksData);
    }
  }, []);

  const today = new Date();
  console.log('Today:', today);
  const todayString = today.toISOString().split('T')[0];
  console.log('TodayString:', todayString);

  // Calculate the start and end of the current week (Monday to Sunday)
  const startOfWeek = new Date();
  
  console.log('Start of the week:', startOfWeek);
 startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  
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

  return (
    <View style={styles.container}>
      <Header />
      <Greeting />
      <View style={styles.taskcontainer}>
        <ScrollView>
        
           {/* Display today's tasks at the top */}
          {todayTasks.length > 0 ?  (
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
          ) : <Text>No tasks for today</Text>}

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