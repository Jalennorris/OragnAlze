import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  description?: string;
  suggestedDeadline?: string;
}

interface TaskEditRowProps {
  task: Task;
  editedTaskText: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  styles: any;
}

const TaskEditRow: React.FC<TaskEditRowProps> = ({
  task,
  editedTaskText,
  onChangeText,
  onSave,
  onCancel,
  styles,
}) => (
  <View style={styles.taskEditContainer}>
    <TextInput
      style={styles.taskInput}
      value={editedTaskText}
      onChangeText={onChangeText}
      autoFocus
      multiline
    />
    <View style={styles.editActions}>
      <TouchableOpacity style={styles.taskActionButton} onPress={onSave}>
        <Ionicons name="checkmark" size={24} color="#4CAF50" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.taskActionButton} onPress={onCancel}>
        <Ionicons name="close" size={24} color="#888" />
      </TouchableOpacity>
    </View>
  </View>
);

export default TaskEditRow;
