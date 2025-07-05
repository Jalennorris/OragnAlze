import React from 'react';
import AskAIButton from '../components/AskAIButton';

const HomeScreen: React.FC = () => {
  const submitFeedback = () => {
    console.log('Feedback submitted!');
    // Add logic for submitting feedback
  };

  return (
    <AskAIButton onTaskAccept={() => console.log('AI Asked')} submitFeedback={submitFeedback} />
  );
};

export default HomeScreen;
