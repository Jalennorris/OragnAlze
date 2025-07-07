import axios from 'axios';

export const submitFeedback = async ({
  user,
  rating,
  feedback,
}: {
  user: string;
  rating: number;
  feedback: string;
}) => {
  return axios.post('http://localhost:8080/api/feedback', {
    user,
    rating,
    feedback,
    createdAt: new Date().toISOString(),
  });
};
