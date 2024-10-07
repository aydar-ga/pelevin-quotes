"use client";

import React from 'react';

interface QuoteCardProps {
  quote: string;
  book: string;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, book }) => {
  return (
    <div className="w-full max-w-md bg-[#1A1B1E] border border-gray-700 rounded-lg shadow-md p-8">
      <p className="text-lg text-center text-gray-300 mb-6">
        &quot;{quote}&quot;
      </p>
      {book && (
        <p className="text-right text-gray-500 text-sm">
          - {book}
        </p>
      )}
    </div>
  );
};

export default QuoteCard;
