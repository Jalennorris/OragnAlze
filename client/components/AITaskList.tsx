import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskEditRow from './TaskEditRow';

interface Task {
  id: string;
  title: string;
  description?: string;
  suggestedDeadline?: string;
}

interface AITaskListProps {
  tasks: Task[];
  editingTaskId: string | null;
  editedTaskText: string;
  onStartEditing: (task: Task) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditText: (text: string) => void;
  onDeleteTask: (taskId: string) => void;
  styles: any;
}

const AITaskList: React.FC<AITaskListProps> = ({
  tasks,
  editingTaskId,
  editedTaskText,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onChangeEditText,
  onDeleteTask,
  styles,
}) => {
  return (
    <>
      {tasks.map((task, index) => {
        const isEditing = editingTaskId === task.id;
        return (
          <View key={task.id} style={styles.taskItem}>
            {isEditing ? (
              <TaskEditRow
                task={task}
                editedTaskText={editedTaskText}
                onChangeText={onChangeEditText}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                styles={styles}
              />
            ) : (
              <View style={styles.taskContentContainer}>
                <View style={styles.taskTextWrapper}>
                  <View style={styles.taskHeaderLine}>
                    <Text style={styles.taskDay}>Day {index + 1}:</Text>
                    {task.suggestedDeadline && (
                      <Text style={styles.taskDeadline}> (Due: {task.suggestedDeadline})</Text>
                    )}
                  </View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description ? (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  ) : null}
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity style={styles.taskActionButton} onPress={() => onStartEditing(task)}>
                    <Ionicons name="create-outline" size={20} color="#FFC107" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.taskActionButton} onPress={() => onDeleteTask(task.id)}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
};

export default AITaskList;
