export interface Task {
  id: string;
  text: string;
  completed: boolean;
  // Add other properties as needed
}

export type BuildForMeState = 'idle' | 'generating' | 'clarifying' | 'done';

export interface AskAIButtonProps {
  onTaskAccept: (tasks: Task[]) => void;
}

// Add any other shared types/interfaces here as needed.
