import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  onTemplatePress: (template: { label: string; prompt: string; days: number }) => void;
  onShortcutPress: (days: number) => void;
  onRecentPress: (idea: string) => void;
  onIdeaPress: (idea: string) => void;
  templates: { label: string; prompt: string; days: number }[];
  shortcuts: { label: string; days: number; prompt?: string }[];
  recent: string[];
  ideas: string[];
  pastelGradients: string[][];
  numDays: number;
  showOnOpen: boolean;
  setShowOnOpen: (v: boolean) => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({
  visible,
  onClose,
  onTemplatePress,
  onShortcutPress,
  onRecentPress,
  onIdeaPress,
  templates,
  shortcuts,
  recent,
  ideas,
  pastelGradients,
  numDays,
  showOnOpen,
  setShowOnOpen,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suggestions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close suggestions">
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Templates */}
          {templates.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Templates</Text>
              <View style={styles.rowWrap}>
                {templates.map((tpl, idx) => (
                  <TouchableOpacity
                    key={tpl.label}
                    style={styles.templateChip}
                    onPress={() => onTemplatePress(tpl)}
                  >
                    <Ionicons name="flash" size={16} color="#6C47FF" style={{ marginRight: 4 }} />
                    <Text style={styles.templateChipText}>{tpl.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {/* Shortcuts */}
          {shortcuts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Shortcuts</Text>
              <View style={styles.rowWrap}>
                {shortcuts.map((sc, idx) => (
                  <TouchableOpacity
                    key={sc.label}
                    style={[
                      styles.shortcutChip,
                      numDays === sc.days && styles.shortcutChipSelected,
                    ]}
                    onPress={() => onShortcutPress(sc.days)}
                  >
                    <Ionicons
                      name={
                        sc.label === "Today"
                          ? "sunny"
                          : sc.label === "Tomorrow"
                          ? "cloud-outline"
                          : sc.label === "Weekend"
                          ? "calendar"
                          : "calendar-outline"
                      }
                      size={15}
                      color={numDays === sc.days ? "#fff" : "#6C47FF"}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={[
                      styles.shortcutChipText,
                      numDays === sc.days && styles.shortcutChipTextSelected,
                    ]}>{sc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {/* Recent Ideas */}
          {recent.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent</Text>
              <View style={styles.rowWrap}>
                {recent.map((idea, idx) => (
                  <TouchableOpacity
                    key={idea}
                    style={styles.recentChip}
                    onPress={() => onRecentPress(idea)}
                  >
                    <Ionicons name="time" size={14} color="#888" style={{ marginRight: 4 }} />
                    <Text style={styles.recentChipText} numberOfLines={1}>{idea}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {/* Suggestion Ideas */}
          {ideas.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ideas</Text>
              <View style={styles.suggestionIdeasList}>
                {ideas.map((idea, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={pastelGradients[idx % pastelGradients.length] || ['#fff', '#fff']}
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
                ))}
              </View>
            </>
          )}
          {/* Show on open toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show suggestions on open</Text>
            <Switch
              value={showOnOpen}
              onValueChange={setShowOnOpen}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,20,30,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#181828',
    borderRadius: 18,
    padding: 18,
    width: 340,
    maxHeight: 540,
    alignItems: 'stretch',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  sectionTitle: {
    color: '#BB86FC',
    fontWeight: '600',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 4,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9E3FF',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 6,
    minWidth: 60,
    maxWidth: 140,
    elevation: 1,
  },
  templateChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 14,
    maxWidth: 110,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 6,
    elevation: 1,
  },
  shortcutChipSelected: {
    backgroundColor: '#6C47FF',
  },
  shortcutChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 14,
  },
  shortcutChipTextSelected: {
    color: '#fff',
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232B3A',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 6,
    elevation: 1,
  },
  recentChipText: {
    color: '#fff',
    fontSize: 14,
    maxWidth: 110,
  },
  suggestionIdeasList: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: 4,
    marginBottom: 8,
  },
  suggestionIdeaChip: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(180,180,200,0.12)',
  },
  suggestionIdeaText: {
    color: '#232B3A',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#AAA',
    fontSize: 14,
    marginRight: 8,
  },
});

export default SuggestionModal;
