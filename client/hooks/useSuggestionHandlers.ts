import { useCallback } from 'react';

interface UseSuggestionHandlersProps {
  setAiQuery: (q: string) => void;
  setNumDays: (n: number) => void;
  addRecentIdea: (idea: string) => void;
  addGoalToHistory: (idea: string) => void;
  setSuggestionIdeas: (ideas: string[]) => void;
  setShowSuggestions: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  fetchAIResponse: () => void;
  inputRef: React.RefObject<any>;
}

export function useSuggestionHandlers({
  setAiQuery,
  setNumDays,
  addRecentIdea,
  addGoalToHistory,
  setSuggestionIdeas,
  setShowSuggestions,
  setIsLoading,
  fetchAIResponse,
  inputRef,
}: UseSuggestionHandlersProps) {
  const handleSuggestionIdeaPress = useCallback((idea: string) => {
    setAiQuery(idea);
    addRecentIdea(idea);
    addGoalToHistory(idea);
    setSuggestionIdeas([]);
    setShowSuggestions(false);
    setIsLoading(true);
    setTimeout(() => {
      fetchAIResponse();
    }, 200);
  }, [
    setAiQuery,
    addRecentIdea,
    addGoalToHistory,
    setSuggestionIdeas,
    setShowSuggestions,
    setIsLoading,
    fetchAIResponse,
  ]);

  const handleTemplatePress = useCallback((template: { label: string; prompt: string; days: number }) => {
    setAiQuery(template.prompt);
    setNumDays(template.days);
    addRecentIdea(template.prompt);
    addGoalToHistory(template.prompt);
    setSuggestionIdeas([]);
    setShowSuggestions(false);
    setIsLoading(true);
    setTimeout(() => {
      fetchAIResponse();
    }, 200);
  }, [
    setAiQuery,
    setNumDays,
    addRecentIdea,
    addGoalToHistory,
    setSuggestionIdeas,
    setShowSuggestions,
    setIsLoading,
    fetchAIResponse,
  ]);

  const handleRecentIdeaPress = useCallback((idea: string) => {
    setAiQuery(idea);
    setShowSuggestions(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  }, [setAiQuery, setShowSuggestions, inputRef]);

  const handleShortcutPress = useCallback((days: number) => {
    setNumDays(days);
  }, [setNumDays]);

  return {
    handleSuggestionIdeaPress,
    handleTemplatePress,
    handleRecentIdeaPress,
    handleShortcutPress,
  };
}
