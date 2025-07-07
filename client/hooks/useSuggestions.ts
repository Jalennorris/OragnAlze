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

  const handleFetchSuggestions = useCallback(() => {
    setErrorMessage(null);
    setSuggestedTasks([]);
    setSuggestionIdeas([]);
    setIsLoading(true);
    setShowSuggestions(true);
    fetchSuggestionIdeas();
    setIsLoading(false);
  }, [setErrorMessage, setSuggestedTasks, setSuggestionIdeas, setIsLoading, fetchSuggestionIdeas]);

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
