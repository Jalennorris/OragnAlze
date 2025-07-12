import { useState, useCallback } from 'react';

type UseSuggestionsProps = {
  setErrorMessage: (msg: string | null) => void;
  setSuggestedTasks: (tasks: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  SUGGESTION_IDEAS: string[];
};

export default function useSuggestions({
  setErrorMessage,
  setSuggestedTasks,
  setIsLoading,
  SUGGESTION_IDEAS,
}: UseSuggestionsProps) {
  const [suggestionIdeas, setSuggestionIdeas] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsOnOpen, setShowSuggestionsOnOpen] = useState(true);
  const [hasAutoShownSuggestions, setHasAutoShownSuggestions] = useState(false);

  const fetchSuggestionIdeas = useCallback(async () => {
    setSuggestionIdeas(SUGGESTION_IDEAS || []);
  }, [SUGGESTION_IDEAS]);

  // Remove or simplify handleFetchSuggestions so it doesn't clear suggestionIdeas
  const handleFetchSuggestions = useCallback(() => {
    setErrorMessage(null);
    setSuggestedTasks([]);
    setShowSuggestions(true);
    fetchSuggestionIdeas();
    // Do not clear suggestionIdeas or set loading here
  }, [setErrorMessage, setSuggestedTasks, setShowSuggestions, fetchSuggestionIdeas]);

  return {
    suggestionIdeas,
    setSuggestionIdeas,
    showSuggestions,
    setShowSuggestions,
    showSuggestionsOnOpen,
    setShowSuggestionsOnOpen,
    hasAutoShownSuggestions,
    setHasAutoShownSuggestions,
    fetchSuggestionIdeas,
    handleFetchSuggestions,
  };
}
