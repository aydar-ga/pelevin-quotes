"use client";

import React, { useState } from 'react';
import { RefreshCw } from "lucide-react";
import QuoteCard from '../components/QuoteCard';

const Home = () => {

  const [quote, setQuote] = useState({
    text: "Нажми на кнопку, чтобы получить цитатку.",
    book: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/randomQuote');
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await response.json();
      setQuote({
        text: data.text,
        book: data.book,
      });
    } catch (error) {
      console.error("Error fetching quote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white text-center">
        Цитатки из Пелевина
      </h1>
      <QuoteCard quote={quote.text} book={quote.book} />
      <button
        onClick={generateQuote}
        disabled={isLoading}
        className="flex items-center mt-6 bg-white text-black font-semibold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors duration-300 shadow-lg"
      >
        {isLoading ? (
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-5 w-5" />
        )}
        Давай цитатку
      </button>
    </div>
  );
};

export default Home;
