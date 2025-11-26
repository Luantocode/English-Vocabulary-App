
import React, { useState, useEffect } from 'react';
import { Question, BloomLevel, UserAnswer } from '../types';
import { CheckCircle, XCircle, ArrowRight, CheckSquare, Languages, Eye, Loader2, MousePointerClick } from 'lucide-react';
import { getRandomCongratulation, getRandomSympathy } from '../constants';

interface Props {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
  onNext: () => void;
  isReviewMode?: boolean;
  cefrLevel: string;
}

const shuffleArray = (array: any[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const LEVEL_LABELS: Record<BloomLevel, string> = {
  [BloomLevel.Remember]: 'Level 1',
  [BloomLevel.Understand]: 'Level 2',
  [BloomLevel.Apply]: 'Level 3',
  [BloomLevel.Analyse]: 'Level 4'
};

const TestQuestion: React.FC<Props> = ({ question, onAnswer, onNext, isReviewMode = false, cefrLevel }) => {
  // Common State
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [shuffledOptionsVi, setShuffledOptionsVi] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  
  // Matching State (Level 3)
  const [matches, setMatches] = useState<Record<string, string>>({}); // pairId -> word
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordBank, setWordBank] = useState<string[]>([]);

  // Translation visibility state
  const [showQuestionTrans, setShowQuestionTrans] = useState(false);
  const [showExplanationTrans, setShowExplanationTrans] = useState(false);
  const [showOptionsTrans, setShowOptionsTrans] = useState<Record<number, boolean>>({});
  const [showMatchingTrans, setShowMatchingTrans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Reset all states when question changes
    setSelectedOptions([]);
    setMatches({});
    setSelectedWord(null);
    setSubmitted(false);
    setFeedback(null);
    
    setShowQuestionTrans(false);
    setShowExplanationTrans(false);
    setShowOptionsTrans({});
    setShowMatchingTrans({});
    
    // Setup Options for MC
    if (question.options) {
      if (question.optionsVi && question.optionsVi.length === question.options.length) {
         const indices = question.options.map((_, i) => i);
         const shuffledIndices = shuffleArray(indices);
         setShuffledOptions(shuffledIndices.map((i: number) => question.options![i]));
         setShuffledOptionsVi(shuffledIndices.map((i: number) => question.optionsVi![i]));
      } else {
         setShuffledOptions(shuffleArray(question.options));
         setShuffledOptionsVi([]);
      }
    }

    // Setup Matching (Apply)
    if (question.level === BloomLevel.Apply && question.matchingPairs) {
        const words = question.matchingPairs.map(p => p.correctAnswer);
        setWordBank(shuffleArray(words));
    }

  }, [question.id, question.options, question.optionsVi, question.matchingPairs]);

  // --- Handlers ---

  const handleOptionClick = (option: string) => {
    if (submitted) return;
    // Single select for Levels 1, 2, 4
    setSelectedOptions([option]);
  };

  // Matching Handlers
  const handleWordSelect = (word: string) => {
    if (submitted) return;
    if (selectedWord === word) {
        setSelectedWord(null);
    } else {
        setSelectedWord(word);
    }
  };

  const handleGapClick = (pairId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering sentence card click if any
    if (submitted) return;
    
    if (matches[pairId]) {
        // Clear existing match
        setMatches(prev => {
            const next = { ...prev };
            delete next[pairId];
            return next;
        });
    } else if (selectedWord) {
        // Assign selected word
        const existingPairId = Object.keys(matches).find(k => matches[k] === selectedWord);
        
        setMatches(prev => {
            const next = { ...prev };
            if (existingPairId) delete next[existingPairId];
            next[pairId] = selectedWord!;
            return next;
        });
        setSelectedWord(null);
    }
  };

  const handleSubmit = () => {
    let isCorrect = false;
    let answerValue: any = "";
    let feedbackMsg = "";

    if (question.level === BloomLevel.Apply && question.matchingPairs) {
       // Check all matches (Case insensitive trim check)
       isCorrect = question.matchingPairs.every(pair => {
           const userSelection = matches[pair.id] || "";
           return userSelection.toLowerCase().trim() === pair.correctAnswer.toLowerCase().trim();
       });
       answerValue = matches;
    } else {
      // Levels 1, 2, 4 are strictly single choice correctOption
      isCorrect = selectedOptions[0] === question.correctOption;
      answerValue = selectedOptions[0];
    }

    setSubmitted(true);
    feedbackMsg = isCorrect ? getRandomCongratulation() : getRandomSympathy();
    setFeedback({ isCorrect, message: feedbackMsg });

    onAnswer({
      questionId: question.id,
      answer: answerValue,
      isCorrect: isCorrect
    });
  };

  const toggleOptionTrans = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptionsTrans(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleMatchingTrans = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMatchingTrans(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllTranslations = () => {
    const areAllVisible = showQuestionTrans; 
    
    setShowQuestionTrans(!areAllVisible);
    setShowExplanationTrans(!areAllVisible);
    
    if (question.options) {
        const newOptionsState: Record<number, boolean> = {};
        question.options.forEach((_, idx) => {
            newOptionsState[idx] = !areAllVisible;
        });
        setShowOptionsTrans(newOptionsState);
    }

    if (question.matchingPairs) {
        const newMatchingState: Record<string, boolean> = {};
        question.matchingPairs.forEach(p => {
            newMatchingState[p.id] = !areAllVisible;
        });
        setShowMatchingTrans(newMatchingState);
    }
  };

  // --- Renderers ---

  const renderStyledText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900 bg-gray-100 px-1 rounded">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderMatchingExercise = () => {
      if (!question.matchingPairs || question.matchingPairs.length === 0) return <div>Error loading matching pairs.</div>;
      
      const availableWords = wordBank.filter(word => !Object.values(matches).includes(word));
      
      return (
          <div className="space-y-6">
              {/* Instructions */}
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <MousePointerClick size={16} />
                  <span>Tap a word from the bank, then tap the box <strong>[ ]</strong> in the sentence.</span>
              </div>

              {/* Word Bank */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Word Bank</h4>
                  <div className="flex flex-wrap gap-2">
                      {wordBank.map((word, idx) => {
                          const isUsed = Object.values(matches).includes(word);
                          const isSelected = selectedWord === word;
                          
                          if (isUsed && !submitted) return null; 

                          let className = "px-4 py-2 rounded-lg font-medium shadow-sm border transition-all cursor-pointer ";
                          
                          if (submitted) {
                              className += "bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-default";
                          } else if (isSelected) {
                              className += "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300 transform scale-105";
                          } else {
                              className += "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:shadow-md";
                          }

                          return (
                              <div 
                                key={idx} 
                                onClick={() => !submitted && !isUsed && handleWordSelect(word)}
                                className={className}
                              >
                                  {word}
                              </div>
                          );
                      })}
                      {!submitted && availableWords.length === 0 && (
                          <span className="text-gray-400 italic text-sm py-2">All words placed. Check your answers below!</span>
                      )}
                  </div>
              </div>

              {/* Sentences */}
              <div className="space-y-4">
                  {question.matchingPairs.map((pair) => {
                      const matchedWord = matches[pair.id];
                      const isCorrect = matchedWord?.toLowerCase().trim() === pair.correctAnswer.toLowerCase().trim();
                      
                      // Strict split for [[GAP]]
                      let parts = pair.questionText.split(/(\[\[GAP\]\])/);
                      
                      // Fallback: If no [[GAP]] token found, force split by appending one to end
                      if (parts.length === 1) {
                          const cleaned = pair.questionText.replace('[GAP]', '').replace('_____', '').trim();
                          parts = [cleaned, '[[GAP]]'];
                      }

                      return (
                          <div 
                            key={pair.id} 
                            className={`p-5 rounded-xl border-2 shadow-sm relative transition-all group ${
                                submitted 
                                  ? 'bg-white cursor-default'
                                  : matchedWord 
                                    ? 'bg-indigo-50 border-indigo-200'
                                    : 'bg-white border-gray-100 hover:border-gray-300'
                            }`}
                          >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                  <div className="flex-1 text-lg leading-relaxed text-gray-800">
                                      {parts.map((part, i) => {
                                          if (part === '[[GAP]]') {
                                               return (
                                                  <span 
                                                    key={i}
                                                    onClick={(e) => handleGapClick(pair.id, e)}
                                                    className={`inline-flex items-center justify-center min-w-[120px] mx-2 px-3 py-1.5 border-2 border-dashed font-bold text-center rounded cursor-pointer transition-all ${
                                                        submitted
                                                          ? isCorrect 
                                                            ? 'border-green-500 text-green-700 bg-green-100 border-solid' 
                                                            : 'border-red-500 text-red-700 bg-red-100 border-solid'
                                                          : matchedWord
                                                            ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm border-solid'
                                                            : selectedWord
                                                                ? 'border-indigo-400 bg-indigo-50 animate-pulse'
                                                                : 'border-gray-400 text-gray-400 bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                                  >
                                                      {matchedWord || (submitted ? <span className="text-red-500 text-sm opacity-75">Missing</span> : "Tap to Fill")}
                                                  </span>
                                               );
                                          }
                                          return <span key={i}>{part}</span>;
                                      })}
                                  </div>
                                  {pair.questionTextVi && (
                                     <button 
                                        onClick={(e) => toggleMatchingTrans(pair.id, e)}
                                        className="text-gray-400 hover:text-indigo-600 shrink-0 mt-1 p-2 hover:bg-black/5 rounded-full"
                                     >
                                        <Languages size={18} />
                                     </button>
                                  )}
                              </div>
                              
                              {showMatchingTrans[pair.id] && pair.questionTextVi && (
                                  <div className="text-indigo-600 italic text-sm mt-2 animate-fade-in pl-2 border-l-2 border-indigo-200">
                                      {pair.questionTextVi}
                                  </div>
                              )}

                              {submitted && !isCorrect && (
                                  <div className="mt-3 flex items-center justify-end">
                                      <div className="flex items-center text-red-600 text-sm font-bold bg-red-50 px-2 py-1 rounded">
                                          <XCircle size={16} className="mr-1" /> Answer: {pair.correctAnswer}
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const renderMultipleChoice = () => (
    <div className="grid grid-cols-1 gap-3 w-full">
        {shuffledOptions.map((option, idx) => {
            const isSelected = selectedOptions.includes(option);
            const isCorrect = question.correctOption === option;
            const translation = shuffledOptionsVi[idx];
            
            let borderClass = 'border-gray-200 hover:bg-gray-50';
            let bgClass = 'bg-white text-gray-700';
            let translationTextColor = 'text-indigo-600'; 
            let icon = null;

            if (submitted) {
                if (isCorrect) {
                    borderClass = 'border-green-500';
                    bgClass = 'bg-green-50 text-green-900';
                    translationTextColor = 'text-green-800';
                    icon = <CheckCircle size={20} className="text-green-600 shrink-0" />;
                } else if (isSelected && !isCorrect) {
                    borderClass = 'border-red-500';
                    bgClass = 'bg-red-50 text-red-900';
                    translationTextColor = 'text-red-800';
                    icon = <XCircle size={20} className="text-red-600 shrink-0" />;
                } else {
                    bgClass = 'bg-gray-50 text-gray-400 opacity-60';
                    translationTextColor = 'text-gray-500';
                }
            } else if (isSelected) {
                borderClass = 'border-indigo-600';
                bgClass = 'bg-indigo-600 text-white';
                translationTextColor = 'text-indigo-100'; 
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                disabled={submitted}
                className={`p-4 rounded-xl border-2 text-left transition-all font-medium flex flex-col justify-center ${bgClass} ${borderClass}`}
              >
                <div className="flex justify-between items-center w-full">
                    <div className="flex-1 mr-2">
                        {renderStyledText(option)}
                    </div>
                    <div className="flex items-center gap-2">
                       {translation && !submitted && (
                          <div 
                            onClick={(e) => toggleOptionTrans(idx, e)}
                            className="p-1.5 rounded hover:bg-black/10 cursor-pointer transition-colors"
                            title="Translate option"
                          >
                             <Languages size={16} />
                          </div>
                       )}
                       {icon}
                    </div>
                </div>
                {translation && (showOptionsTrans[idx] || submitted) && (
                    <div className={`mt-2 text-sm italic border-t pt-2 w-full animate-fade-in ${submitted ? 'border-black/10' : 'border-current opacity-60'} ${translationTextColor}`}>
                        {renderStyledText(translation)}
                    </div>
                )}
              </button>
            );
        })}
    </div>
  );

  const getLevelColor = (level: BloomLevel) => {
      switch(level) {
          case BloomLevel.Remember: return 'bg-blue-100 text-blue-800';
          case BloomLevel.Understand: return 'bg-cyan-100 text-cyan-800';
          case BloomLevel.Apply: return 'bg-teal-100 text-teal-800';
          case BloomLevel.Analyse: return 'bg-emerald-100 text-emerald-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  const areAnyTranslationsVisible = showQuestionTrans || showExplanationTrans;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${getLevelColor(question.level)}`}>
                    {LEVEL_LABELS[question.level]}
                </span>
                {question.wordTerm && 
                question.level !== BloomLevel.Analyse && 
                question.level !== BloomLevel.Apply && (
                    <span className="text-gray-400 font-medium text-sm">Target: <span className="text-indigo-600">{question.wordTerm}</span></span>
                )}
            </div>
            
            <button 
                onClick={toggleAllTranslations}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-2 py-1 rounded-full transition-colors"
            >
                <Eye size={14} />
                {areAnyTranslationsVisible ? "Hide Translations" : "Show All"}
            </button>
        </div>

        <div className="mb-8">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
                    {question.questionText}
                </h3>
                {question.questionTextVi && (
                    <button 
                        onClick={() => setShowQuestionTrans(!showQuestionTrans)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                        title="Translate Question"
                    >
                        <Languages size={20} />
                    </button>
                )}
            </div>
            {showQuestionTrans && question.questionTextVi && (
                <div className="mt-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg italic animate-fade-in border-l-4 border-indigo-300">
                    {question.questionTextVi}
                </div>
            )}
        </div>

        <div className="mb-8">
           {question.level === BloomLevel.Apply ? (
               renderMatchingExercise()
           ) : (
               renderMultipleChoice()
           )}
        </div>

        {submitted && feedback && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${feedback.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800 border border-red-100'}`}>
            {feedback.isCorrect ? <CheckCircle className="shrink-0" /> : <XCircle className="shrink-0" />}
            <span className="font-semibold text-lg">{feedback.message}</span>
          </div>
        )}
        
        {submitted && question.explanation && (
             <div className="mb-6 text-gray-600 text-sm bg-gray-50 p-4 rounded-lg relative">
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-700">Explanation: </span>
                    {question.explanationVi && (
                         <button 
                            onClick={() => setShowExplanationTrans(!showExplanationTrans)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                         >
                             <Languages size={16} />
                         </button>
                    )}
                </div>
                <p>{renderStyledText(question.explanation)}</p>
                {showExplanationTrans && question.explanationVi && (
                    <p className="mt-2 pt-2 border-t border-gray-200 text-indigo-600 italic">
                        {question.explanationVi}
                    </p>
                )}
             </div>
        )}

        <div className="flex justify-end">
            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={
                        (![BloomLevel.Apply].includes(question.level) && selectedOptions.length === 0) ||
                        (question.level === BloomLevel.Apply && question.matchingPairs && Object.keys(matches).length !== question.matchingPairs.length)
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                >
                    Submit Answer
                </button>
            ) : (
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all"
                >
                    {isReviewMode ? "Next Review" : "Next Question"} <ArrowRight size={20} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TestQuestion;
