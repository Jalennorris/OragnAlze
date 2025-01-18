import React, { useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import TaskItem from '@/component/taskItem';
import { useRouter } from 'expo-router';

// Define types for the task structure
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

// Define types for the props received by HomeScreen
interface HomeScreenProps {
  navigation: any; // You can refine this type to be more specific if you are using React Navigation
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Task 1', description: 'Task 1 description', dueDate: '2025-01-30' },
    { id: '2', title: 'Task 2', description: 'Task 2 description', dueDate: '2025-02-02' },
  ]);

  const handleTaskPress = (taskId: string) => {
    // Navigate to the Task Detail screen (you can modify this when adding navigation)
    console.log('Task pressed: ', taskId);
  };

  const handleAddTask = () => {
    router.push('/addTaskScreen'); // Navigate to the AddTaskScreen (you can modify this when adding navigation)
    console.log('Add new task');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={({ item }) => <TaskItem task={item} onPress={handleTaskPress} />}
        keyExtractor={(item) => item.id}
      />
      <Button title="Add New Task" onPress={handleAddTask} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default HomeScreen;