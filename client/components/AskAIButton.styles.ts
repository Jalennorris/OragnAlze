import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  // --- Floating AI Button Styles ---
  buttonContainer: {
    position: 'absolute',
    bottom: 38,
    right: 22,
    zIndex: 10,
    elevation: 20,
  },
  gradientRing: {
    width: 83, // 92 * 0.9
    height: 83,
    borderRadius: 41.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 13,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  modernButtonTouchable: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    shadowColor: '#B7E0FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 8,
  },
  glassButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(180,180,180,0.18)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 7,
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerGlow: {
    position: 'absolute',
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: 'rgba(166,191,255,0.14)',
    top: 8,
    left: 8,
    zIndex: 1,
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 1,
  },
  sparklePulse: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 2,
  },
  glowRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: '#BB86FC',
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    zIndex: -1,
    alignSelf: 'center',
  },

  // --- Modal Styles ---
  modalWrapper: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainerOuter: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainerInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalControlButton: {
    padding: 8,
  },
  modalTitle: {
    color: '#E0E0E0',
    fontSize: 20,
    fontWeight: '600',
  },

  // --- Placeholder & Error Styles ---
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 150,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },
  errorTextInline: {
    color: '#FF7043',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },

  // --- Task List Styles ---
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
  taskText: {
    color: '#E0E0E0',
    fontSize: 15,
    lineHeight: 22,
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

  // --- Input Area Styles ---
  inputArea: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  daySelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  daySelectorLabel: {
    color: '#AAA',
    fontSize: 14,
    marginRight: 8,
  },
  daySelectorLabelEnd: {
    color: '#AAA',
    fontSize: 14,
    marginLeft: 8,
  },
  daySelectorScrollView: {
    flex: 1,
  },
  daySelectorScrollContent: {
    paddingVertical: 5,
    alignItems: 'center',
  },
  dayButton: {
    backgroundColor: '#333',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    minWidth: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  dayButtonSelected: {
    backgroundColor: '#6200EE',
    borderColor: '#BB86FC',
  },
  dayButtonDisabled: {
    opacity: 0.6,
  },
  dayButtonText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#FFF',
  },
  inputWrapper: {
    
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 50,
  },
  inputFieldQuery: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    color: '#E0E0E0',
    fontSize: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 2,
    minHeight: 50,
 
    textAlignVertical: 'center',
    borderRadius: 12,
    position: 'relative', 
    justifyContent: 'center' ,
  
    right: 10,
    width: 345
  },
  controlButtonInInput: {
    marginLeft: 8,
    marginBottom: 0, // changed from 8 to 0 to bring the button up
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  generateButton: {
    backgroundColor: '#6200EE',
    bottom: 3
  },
  generateButtonDisabled: {
    backgroundColor: '#444',
    bottom: 3
  
  },
  stopButton: {
    backgroundColor: '#F44336', // strong red
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 3
  },

  // --- Action Buttons (Accept/Clear) ---
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 5,
  },
  actionButton: {
    position: 'relative',
    bottom: 240,
    flexDirection: 'row',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 18,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  acceptAllButton: {
   
  },
  clearButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // --- Suggestions Button & Chips ---
  suggestionButtonWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  suggestionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 320,
  },
  suggestionButtonText: {
    color: '#232B3A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionIdeasContainer: {


    zIndex: 2,
    height: 65,
    marginTop: 18,
    alignItems: 'flex-start',
    width: '100%',
  },
  suggestionIdeasTitle: {
    color: '#AAA',
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  suggestionIdeasScrollWrapper: {
    width: '100%',
    maxHeight: 180,
  },
  suggestionIdeasList: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 8,
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

  // --- Surprise Bubble Styles ---
  surpriseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 22,
    minHeight: 38,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#BB86FC',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  surpriseBubbleText: {
    color: '#6C47FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    textShadowColor: '#fff',
    textShadowRadius: 2,
  },

  // --- Feedback/Star Styles ---
  modernStarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modernStarUnselected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  feedbackLabelText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
    minHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // --- Build For Me Styles ---
  buildForMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C47FF',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
    elevation: 2,
  },
  buildForMeButtonDisabled: {
    opacity: 0.5,
  },
  buildForMeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buildForMeClarifyContainer: {
    backgroundColor: '#232B3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  buildForMeClarifyQuestion: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 10,
  },
  buildForMeClarifyInput: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 80,
  },
  buildForMeReviewingContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  buildForMeReviewingText: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // --- Smart Default Chip Styles ---
  smartDefaultChipGradient: {
    borderRadius: 22,
    padding: 2,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginHorizontal: 2,
  },
  smartDefaultChipTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 38,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  smartDefaultChipText: {
    color: '#6C47FF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
    textShadowColor: '#fff',
    textShadowRadius: 2,
  },

  // --- Shortcut Chips (Horizontal Scroll) ---
  shortcutChipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 4,
    paddingRight: 8,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 2,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0D7FF',
  },
  shortcutChipSelected: {
    backgroundColor: '#6C47FF',
    borderColor: '#6C47FF',
    shadowOpacity: 0.18,
  },
  shortcutChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 15,
  },
  shortcutChipTextSelected: {
    color: '#fff',
  },

  // --- Compact Chips (Horizontal Scroll) ---
  compactChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
    minHeight: 38,
  },
  compactChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingLeft: 2,
    paddingRight: 2,
  },
  compactSmartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9E3FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 6,
    minWidth: 60,
    maxWidth: 160,
    elevation: 1,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  compactSmartChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 14,
    maxWidth: 110,
  },
  compactShortcutChip: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingVertical: 3, // reduced from 6
    paddingHorizontal: 18, // increased from 10
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  compactShortcutChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 13, // reduced from 14
    textAlign: 'center',
    maxWidth: 110,
  },

  // --- Advanced Toggle & Divider ---
  advancedToggle: {
    marginLeft: 4,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(187,134,252,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDivider: {
    height: 1,
    backgroundColor: '#232B3A',
    opacity: 0.13,
    marginVertical: 6,
    borderRadius: 1,
  },
});

export default styles;
