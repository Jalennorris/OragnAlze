import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  description: string;
  suggestedDeadline?: string;
}

interface AITaskItemProps {
  task: Task;
  index: number;
  isEditing: boolean;
  editedTaskText: string;
  onEdit: () => void;
  onDelete: () => void;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AITaskItem: React.FC<AITaskItemProps> = ({
  task,
  index,
  isEditing,
  editedTaskText,
  onEdit,
  onDelete,
  onChangeText,
  onSave,
  onCancel,
}) => {
  return (
    <View style={styles.taskItem}>
      {isEditing ? (
        <View style={styles.taskEditContainer}>
          <TextInput
            style={styles.taskInput}
            value={editedTaskText}
            onChangeText={onChangeText}
            autoFocus
            multiline
            blurOnSubmit={true}
            onSubmitEditing={onSave}
            returnKeyType="done"
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={onSave} style={styles.taskActionButton} accessibilityLabel="Save edit">
              <Ionicons name="checkmark" size={22} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={styles.taskActionButton} accessibilityLabel="Cancel edit">
              <Ionicons name="close" size={22} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.taskContentContainer}>
          <View style={styles.taskTextWrapper}>
            <View style={styles.taskHeaderLine}>
              <Text style={styles.taskDay}>Day {index + 1}</Text>
              {task.suggestedDeadline && (
                <Text style={styles.taskDeadline}>{task.suggestedDeadline}</Text>
              )}
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.description ? (
              <Text style={styles.taskDescription}>{task.description}</Text>
            ) : null}
          </View>
          <View style={styles.taskActions}>
            <TouchableOpacity onPress={onEdit} style={styles.taskActionButton} accessibilityLabel="Edit task">
              <Ionicons name="pencil" size={20} color="#BB86FC" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.taskActionButton} accessibilityLabel="Delete task">
              <Ionicons name="trash" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  taskEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTextWrapper: {
    flex: 1,
    marginRight: 8,
  },
  taskHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskDay: {
    color: '#BB86FC',
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 22,
  },
  taskDeadline: {
    color: '#A0A0A0',
    fontSize: 13,
    marginLeft: 5,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  taskTitle: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    lineHeight: 22,
  },
  taskDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 0,
    lineHeight: 20,
  },
  taskInput: {
    flex: 1,
    color: '#FFF',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginRight: 8,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskActionButton: {
    marginLeft: 10,
    padding: 5,
  },
});

export default AITaskItem;
