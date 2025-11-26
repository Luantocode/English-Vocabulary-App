import React, { useState } from 'react';
import { AppConfig } from '../types';
import { LEVELS } from '../constants';
import { ArrowRight, BookOpen } from 'lucide-react';

interface Props {
  onStart: (config: AppConfig) => void;
  isLoading: boolean;
}

const SetupForm: React.FC<Props> = ({ onStart, isLoading }) => {
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('');
  const [targetWords, setTargetWords] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // automatically count words if provided, otherwise default to 5 
    // (Note: If targetWords is empty, App.tsx will trigger the Word Pool flow which generates 30 options anyway)
    const derivedCount = targetWords.trim() 
      ? targetWords.split(',').filter(w => w.trim().length > 0).length 
      : 5;

    onStart({ level, topic, targetWords, numWords: derivedCount });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center justify-center mb-8">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <BookOpen size={32} />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">LexiFlow</h1>
      <p className="text-center text-gray-500 mb-8">Build your vocabulary with AI-powered progression.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEFR Level</label>
          <div className="flex justify-between gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  level === l
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic (Optional)</label>
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Business, Tech"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Words (Optional)</label>
          <textarea
            value={targetWords}
            onChange={(e) => setTargetWords(e.target.value)}
            placeholder="Enter specific words separated by commas..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px]"
          />
        </div>

        <div className="space-y-3">
            <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
            {isLoading ? (
                <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Curating...
                </>
            ) : (
                <>
                Start Learning <ArrowRight size={20} />
                </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default SetupForm;