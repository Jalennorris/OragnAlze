import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from '../components/SearchBar';
import DateSection from '../components/DateSection';

const TaskList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [tasks, setTasks] = useState<Task[]>([
        // Example tasks
        { taskId: 1, taskName: 'Buy groceries', deadline: '2023-10-01', ...otherTaskProps },
        { taskId: 2, taskName: 'Meeting with team', deadline: '2023-10-02', ...otherTaskProps },
        // ...other tasks
    ]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        // Filter tasks based on the query (search by name or deadline)
        const filteredTasks = tasks.filter(task =>
            task.taskName.toLowerCase().includes(query.toLowerCase()) ||
            task.deadline.includes(query) // Search by date
        );

        setTasks(filteredTasks);
    };

    return (
        <View style={styles.container}>
            <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
                colors={{ text: '#000', placeholder: '#888' }}
            />
            <DateSection
                title="Tasks"
                tasks={tasks}
                onTaskPress={(taskId) => console.log(`Task ${taskId} pressed`)}
                onToggleCompletion={(taskId) => console.log(`Toggle completion for ${taskId}`)}
                onDelete={(taskId) => console.log(`Delete task ${taskId}`)}
                getPriorityColor={(priority) => 
                    priority === 'high' ? 'red' : 
                    priority === 'medium' ? 'orange' : 
                    priority === 'low' ? 'green' : 'gray'
                }
                colors={{ text: '#000' }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
});

export default TaskList;
