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
    }

    const SearchBar : React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, colors }) => {
        const [showSearch, setShowSearch] = useState(false);
        const searchAnim = useRef(new Animated.Value(0)).current;

        const toggleSearch = useCallback(() => {
            Animated.timing(searchAnim, {
              toValue: showSearch ? 0 : 1,
              duration: 300,
              useNativeDriver: false,
            }).start();
            setShowSearch((prev) => !prev);
          }, [showSearch]);

          const searchBarWidth = searchAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '75%'],
          });

         return (
            <View style={styles.iconsContainer}>
              <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
                {showSearch && (
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search tasks..."
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    accessibilityLabel="Search tasks"
                  />
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
        });
        
        export default SearchBar;