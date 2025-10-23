import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    Animated,
    Keyboard,
    Dimensions,
    Pressable,
    Platform,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import * as Haptics from 'expo-haptics';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    colors: {
        text: string;
        placeholder: string;
        background?: string;
        border?: string;
    };
    onSearch?: (query: string) => void;
    description?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    colors,
    onSearch = () => {},
    description,
}) => {
    const [showSearch, setShowSearch] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const descAnim = useRef(new Animated.Value(0)).current;
    const iconAnim = useRef(new Animated.Value(0)).current;

    // Debounced search callback stored in a ref
    const debouncedOnSearch = useRef(debounce(onSearch, 300));

    useEffect(() => {
        debouncedOnSearch.current = debounce(onSearch, 300);
        return () => {
            debouncedOnSearch.current.cancel();
        };
    }, [onSearch]);

    const toggleSearch = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(searchAnim, {
                toValue: showSearch ? 0 : 1,
                duration: 320,
                useNativeDriver: false,
            }),
            Animated.timing(iconAnim, {
                toValue: showSearch ? 0 : 1,
                duration: 320,
                useNativeDriver: true,
            }),
        ]).start(() => {
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
                Keyboard.dismiss();
                setIsActive(false);
                Animated.timing(descAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: false,
                }).start();
            }
        });
    }, [showSearch, setSearchQuery, onSearch, searchAnim, descAnim, iconAnim]);

    // Responsive width: 85% of screen width
    const searchBarWidth = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCREEN_WIDTH * 0.65],
    });

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        debouncedOnSearch.current(query);
    };

    const descriptionOpacity = descAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const iconRotation = iconAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    // Memoize dynamic styles for performance
    const dynamicSearchContainer = useMemo(
        () => [
            styles.searchContainer,
            {
                width: searchBarWidth,
                borderColor: isActive
                    ? colors.text
                    : colors.border || '#e0e0e0',
                backgroundColor: colors.background || '#fff',
                shadowColor: colors.text,
            },
        ],
        [searchBarWidth, isActive, colors]
    );

    return (
        <View style={styles.outerContainer}>
            <Animated.View
                style={dynamicSearchContainer}
                accessibilityLiveRegion="polite"
            >
                {showSearch && (
                    <View style={styles.inputRow}>
                        <Ionicons
                            name="search"
                            size={20}
                            color={colors.placeholder}
                            style={{ marginRight: 6 }}
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                        />
                        <TextInput
                            style={[
                                styles.searchInput,
                                { color: colors.text, flex: 1 },
                            ]}
                            placeholder="Search tasks..."
                            placeholderTextColor={colors.placeholder}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            accessibilityLabel="Search tasks"
                            onFocus={() => setIsActive(true)}
                            onBlur={() => setIsActive(false)}
                            autoFocus
                            returnKeyType="search"
                            underlineColorAndroid="transparent"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable
                                onPress={() => {
                                    setSearchQuery('');
                                    onSearch('');
                                }}
                                style={({ pressed }) => [
                                    styles.clearButton,
                                    pressed && { opacity: 0.5 },
                                ]}
                                accessibilityLabel="Clear search"
                                accessibilityRole="button"
                            >
                                <Ionicons name="close-circle" size={20} color={colors.placeholder} />
                            </Pressable>
                        )}
                    </View>
                )}
                {showSearch && description && (
                    <Animated.Text
                        style={[
                            styles.description,
                            {
                                color: colors.placeholder,
                                opacity: descriptionOpacity,
                            },
                        ]}
                        accessibilityLabel={description}
                    >
                        {description}
                    </Animated.Text>
                )}
            </Animated.View>
            <Pressable
                style={({ pressed }) => [
                    styles.iconButton,
                    pressed && { opacity: 0.7 },
                ]}
                onPress={toggleSearch}
                accessibilityLabel={showSearch ? 'Close search' : 'Open search'}
                accessibilityRole="button"
                android_ripple={{ color: '#ccc', borderless: true }}
            >
                <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                    <Ionicons
                        name={showSearch ? 'close' : 'search'}
                        size={26}
                        color={colors.text}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                    />
                </Animated.View>
            </Pressable>
        </View>
    );
};

SearchBar.defaultProps = {
    onSearch: () => {},
    description: '',
};

const styles = StyleSheet.create({
    outerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    searchContainer: {
        overflow: 'hidden',
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        justifyContent: 'center',
        paddingHorizontal: 14,
        marginRight: 10,
        backgroundColor: '#fff',
        // Modern shadow/elevation
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        fontSize: 17,
        paddingVertical: 0,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
    },
    iconButton: {
        height: 48,
        width: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    clearButton: {
        marginLeft: 4,
        padding: 2,
        borderRadius: 12,
    },
    description: {
        fontSize: 13,
        marginTop: 4,
        marginLeft: 2,
    },
});

export default SearchBar;