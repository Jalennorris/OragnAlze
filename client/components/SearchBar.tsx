import React, {useState, useCallback, useRef, useEffect} from "react";
import {View, TextInput, StyleSheet, TouchableOpacity, Animated, Keyboard, Dimensions} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';

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

const SCREEN_WIDTH = Dimensions.get('window').width;

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, colors, onSearch = () => {}, description }) => {
    const [showSearch, setShowSearch] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const descAnim = useRef(new Animated.Value(0)).current;

    // Debounced search callback stored in a ref
    const debouncedOnSearch = useRef(debounce(onSearch, 300));

    useEffect(() => {
        // Update debounce if onSearch changes
        debouncedOnSearch.current = debounce(onSearch, 300);
        return () => {
            debouncedOnSearch.current.cancel();
        };
    }, [onSearch]);

    const toggleSearch = useCallback(() => {
        Animated.timing(searchAnim, {
            toValue: showSearch ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            if (!showSearch) {
                setShowSearch(true);
                Animated.timing(descAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            } else {
                setShowSearch(false);
                setSearchQuery('');
                onSearch('');
                Keyboard.dismiss(); // Close the keyboard
                setIsActive(false);
                Animated.timing(descAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: false,
                }).start();
            }
        });
    }, [showSearch, setSearchQuery, onSearch, searchAnim, descAnim]);

    // Responsive width: 75% of screen width
    const searchBarWidth = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCREEN_WIDTH * 0.75],
    });

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        debouncedOnSearch.current(query);
    };

    const descriptionOpacity = descAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <View style={styles.iconsContainer}>
            <Animated.View
                style={[
                    styles.searchContainer,
                    {
                        width: searchBarWidth,
                        borderColor: isActive ? colors.text : '#ccc',
                    }
                ]}
                accessibilityLiveRegion="polite"
            >
                {showSearch && (
                    <>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search tasks..."
                            placeholderTextColor={colors.placeholder}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            accessibilityLabel="Search tasks"
                            onFocus={() => setIsActive(true)}
                            onBlur={() => setIsActive(false)}
                        />
                        {description && (
                            <Animated.Text
                                style={[
                                    styles.description,
                                    { color: colors.placeholder, opacity: descriptionOpacity }
                                ]}
                            >
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
                accessibilityRole="button"
            >
                <Ionicons name={showSearch ? 'close' : 'search'} size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};

SearchBar.defaultProps = {
    onSearch: () => {},
    description: '',
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