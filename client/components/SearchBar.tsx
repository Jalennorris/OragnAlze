import React, {useState, useCallback, useRef} from "react";
import {View, TextInput, StyleSheet, TouchableOpacity, Animated} from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps{
    searchQuery: string;
    setSearchQuery: (query: string)  => void;
    colors: {
        text: string;
        placeholder: string;
    };
    onSearch: (query: string) => void; // New prop for handling search logic
    description?: string; // New optional prop for description
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, colors, onSearch = () => {}, description }) => {
    const [showSearch, setShowSearch] = useState(false);
    const searchAnim = useRef(new Animated.Value(0)).current;

    const toggleSearch = useCallback(() => {
        Animated.timing(searchAnim, {
            toValue: showSearch ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            if (!showSearch) {
                setShowSearch(true);
            } else {
                setShowSearch(false);
                setSearchQuery(''); // Clear search query when closing search
                onSearch(''); // Trigger search with an empty query to reset results
            }
        });
    }, [showSearch, setSearchQuery, onSearch]);

    const searchBarWidth = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '75%'],
    });

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        onSearch(query); // Trigger the search logic for all tasks
    };

    return (
        <View style={styles.iconsContainer}>
            <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
                {showSearch && (
                    <>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search tasks..."
                            placeholderTextColor={colors.placeholder}
                            value={searchQuery}
                            onChangeText={handleSearchChange} // Updated to use handleSearchChange
                            accessibilityLabel="Search tasks"
                        />
                        {description && (
                            <Animated.Text style={[styles.description, { color: colors.placeholder }]}>
                                {description}
                            </Animated.Text>
                        )}
                    </>
                )}
            </Animated.View>
            <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleSearch}
                accessibilityLabel={showSearch ? 'Close search' : 'Open search'}
            >
                <Ionicons name={showSearch ? 'close' : 'search'} size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    iconButton: {
        marginLeft: 10,
    },
    description: {
        fontSize: 12,
        marginTop: 5,
    },
});

export default SearchBar;