
import React from 'react';
import { Question, UserAnswer, BloomLevel } from '../types';
import { RefreshCw, CheckCircle2, XCircle, Home, FileText } from 'lucide-react';

interface Props {
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  onRetry: (wrongIds: string[]) => void;
  onNewTest: () => void;
  onHome: () => void;
}

const LEVEL_LABELS: Record<BloomLevel, string> = {
  [BloomLevel.Remember]: 'Level 1',
  [BloomLevel.Understand]: 'Level 2',
  [BloomLevel.Apply]: 'Level 3',
  [BloomLevel.Analyse]: 'Level 4'
};

const ResultsView: React.FC<Props> = ({ questions, userAnswers, onRetry, onNewTest, onHome }) => {
  // All levels are now auto-graded
  const scorableQuestions = questions;
  
  const correctCount = scorableQuestions.reduce((acc, q) => {
    return (userAnswers[q.id]?.isCorrect) ? acc + 1 : acc;
  }, 0);

  const score = scorableQuestions.length > 0 ? Math.round((correctCount / scorableQuestions.length) * 100) : 0;
  
  const wrongQuestionIds = questions
    .filter(q => !userAnswers[q.id]?.isCorrect)
    .map(q => q.id);

  const renderStyledText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</span>;
        }
        return <span key={index}>{part}</span>;
      });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Session Complete!</h2>
        <div className="flex items-center justify-center gap-2 mt-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="transform -rotate-90 w-32 h-32">
                    <circle cx="64" cy="64" r="60" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                    <circle cx="64" cy="64" r="60" stroke="#4f46e5" strokeWidth="8" fill="none" 
                        strokeDasharray={377} 
                        strokeDashoffset={377 - (377 * score) / 100} 
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute text-3xl font-bold text-indigo-600">{score}%</span>
            </div>
        </div>
        <p className="text-gray-500 mt-4">Accuracy score</p>
      </div>

      <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
        {questions.map((q, idx) => {
          const ans = userAnswers[q.id];
          const isCorrect = ans?.isCorrect;

          return (
            <div key={idx} className={`p-4 rounded-xl border flex items-start justify-between ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 bg-white/50 rounded text-gray-600">{LEVEL_LABELS[q.level]}</span>
                      {q.wordTerm && <span className="text-sm text-gray-500">{q.wordTerm}</span>}
                  </div>
                  <p className="font-medium text-gray-800">{q.questionText}</p>
                  {!isCorrect && (
                      <div className="mt-2 text-sm text-gray-600 bg-white/60 p-2 rounded">
                        <span className="font-semibold">Correct: </span>
                        {renderStyledText(q.correctOption || (q.correctOption) || '')}
                      </div>
                  )}
               </div>
               <div className="ml-4 mt-1">
                   {isCorrect ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-600" />}
               </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        {wrongQuestionIds.length > 0 && (
          <button 
            onClick={() => onRetry(wrongQuestionIds)}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md transition-all"
          >
            <RefreshCw size={20} /> Retake Wrong
          </button>
        )}
        <button 
            onClick={onNewTest}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold shadow-md transition-all"
        >
            <FileText size={20} /> New Test
        </button>
        <button 
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold shadow-md transition-all"
        >
            <Home size={20} /> Home
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
