import { Stack } from "expo-router";
import React, { useState, useEffect } from 'react';
import LoadingPage from "@/Screen/LoadingPage";
import  AuthStack from  '../navigation/AuthStack';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate a 1-second loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <AuthStack />
   
  );
}