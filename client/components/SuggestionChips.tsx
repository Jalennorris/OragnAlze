import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SuggestionChipsProps {
  ideas: string[];
  pastelGradients: string[][];
  onIdeaPress: (idea: string) => void;
  styles: any;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  ideas,
  pastelGradients,
  onIdeaPress,
  styles,
}) => (
  <ScrollView
    horizontal={true}
    style={{ maxHeight: undefined, minHeight: 40 }} // remove maxHeight, set minHeight for horizontal chips
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={[
      styles.suggestionIdeasList,
      { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }
    ]}
  >
    {Array.isArray(ideas) ? ideas.map((idea, idx) => (
      <LinearGradient
        key={idx}
        colors={Array.isArray(pastelGradients) && Array.isArray(pastelGradients[idx % pastelGradients.length]) ? pastelGradients[idx % pastelGradients.length] : ['#eee', '#ccc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.suggestionIdeaChip}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => onIdeaPress(idea)}
        >
          <Text style={styles.suggestionIdeaText}>{idea}</Text>
        </TouchableOpacity>
      </LinearGradient>
    )) : null}
  </ScrollView>
);

export default SuggestionChips;