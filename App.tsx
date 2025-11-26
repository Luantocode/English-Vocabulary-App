
import React, { useState } from 'react';
import { AppConfig, Word, Question, AppState, UserAnswer, WordPoolItem } from './types';
import { generateVocabulary, generateTest, generateWordPool } from './services/geminiService';
import SetupForm from './components/SetupForm';
import LearnCard from './components/LearnCard';
import TestQuestion from './components/TestQuestion';
import ResultsView from './components/ResultsView';
import WordSelection from './components/WordSelection';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('setup');
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  
  // Data States
  const [vocab, setVocab] = useState<Word[]>([]);
  const [wordPool, setWordPool] = useState<WordPoolItem[]>([]);
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [reviewIds, setReviewIds] = useState<string[]>([]);

  // Navigation States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleSetupSubmit = async (config: AppConfig) => {
    setAppConfig(config);
    
    // If user provided specific words, go straight to generating details
    if (config.targetWords && config.targetWords.trim() !== '') {
        await fetchFullVocabulary(config);
    } else {
        // If no words provided, fetch a random pool for selection first
        await fetchWordPool(config);
    }
  };

  const fetchWordPool = async (config: AppConfig) => {
      setState('loading_pool');
      try {
          const result = await generateWordPool(config.level, config.topic);
          setWordPool(result.pool);
          setTopic(result.topic);
          // Update config with the generated topic if it was random
          setAppConfig(prev => prev ? { ...prev, topic: result.topic } : null);
          setState('selecting_words');
      } catch (error) {
          alert("Failed to generate word pool. Please try again.");
          setState('setup');
      }
  };

  const handleSelectionConfirm = async (selectedWords: string[]) => {
      if (!appConfig) return;
      
      const updatedConfig = { 
          ...appConfig, 
          targetWords: selectedWords.join(', '),
          numWords: selectedWords.length
      };
      setAppConfig(updatedConfig);
      await fetchFullVocabulary(updatedConfig);
  };

  const fetchFullVocabulary = async (config: AppConfig) => {
    setState('loading_vocab');
    try {
      const result = await generateVocabulary(config);
      setVocab(result.words);
      // Ensure topic is synced if user provided target words but no topic
      if (!topic && result.topic) setTopic(result.topic);
      setState('learning');
    } catch (error) {
      alert("Failed to generate vocabulary details. Please try again.");
      setState('setup');
    }
  };

  const handleNextCard = async () => {
    if (currentCardIndex < vocab.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      await startTest();
    }
  };

  const startTest = async () => {
      setState('loading_test');
      try {
        const level = appConfig?.level || 'B1';
        const generatedQuestions = await generateTest(vocab, level);
        setQuestions(generatedQuestions);
        setState('testing');
      } catch (error) {
        alert("Failed to generate test. Please try again.");
        setState('results'); // Fallback
      }
  };

  const handleAnswer = (answer: UserAnswer) => {
    setUserAnswers(prev => ({ ...prev, [answer.questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (reviewIds.length > 0) {
       if (currentQuestionIndex < reviewIds.length - 1) {
           setCurrentQuestionIndex(prev => prev + 1);
       } else {
           setReviewIds([]);
           setState('results');
       }
       return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setState('results');
    }
  };

  const handleRetry = (wrongIds: string[]) => {
    setReviewIds(wrongIds);
    setCurrentQuestionIndex(0);
    setState('testing');
  };

  const handleNewTest = async () => {
     setCurrentQuestionIndex(0);
     setUserAnswers({});
     setReviewIds([]);
     await startTest();
  };

  const handleHome = () => {
    setVocab([]);
    setQuestions([]);
    setWordPool([]);
    setCurrentCardIndex(0);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setReviewIds([]);
    setAppConfig(null);
    setTopic('');
    setState('setup');
  };

  const activeQuestion = reviewIds.length > 0 
    ? questions.find(q => q.id === reviewIds[currentQuestionIndex])
    : questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col sm:flex-row sm:justify-between items-center sticky top-0 z-10 shadow-sm gap-2">
        <div className="font-bold text-xl text-indigo-600 flex items-center gap-2">
          <span>LexiFlow</span>
          {state !== 'setup' && <span className="text-gray-300 text-sm font-normal hidden sm:inline">|</span>}
          {state !== 'setup' && topic && <span className="text-gray-600 text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">{topic}</span>}
        </div>
        
        <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            {state !== 'setup' && appConfig?.level && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">{appConfig.level}</span>}
            
            {state === 'learning' && (
                <span>Word {currentCardIndex + 1} / {vocab.length}</span>
            )}
            {state === 'testing' && activeQuestion && (
                <span>
                    {reviewIds.length > 0 ? 'Reviewing ' : 'Question '} 
                    {currentQuestionIndex + 1} / {reviewIds.length > 0 ? reviewIds.length : questions.length}
                </span>
            )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        
        {state === 'setup' && (
          <SetupForm onStart={handleSetupSubmit} isLoading={false} />
        )}

        {(state === 'loading_pool' || state === 'loading_vocab' || state === 'loading_test') && (
          <div className="flex flex-col items-center gap-4 animate-pulse">
             <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="text-gray-500 font-medium">
                {state === 'loading_pool' && 'Finding interesting words...'}
                {state === 'loading_vocab' && 'AI is curating details for your words...'}
                {state === 'loading_test' && 'AI is constructing your assessment...'}
             </p>
          </div>
        )}

        {state === 'selecting_words' && (
            <WordSelection 
                pool={wordPool} 
                topic={topic}
                onConfirm={handleSelectionConfirm}
                onCancel={handleHome}
            />
        )}

        {state === 'learning' && vocab.length > 0 && (
          <LearnCard 
            word={vocab[currentCardIndex]} 
            onNext={handleNextCard} 
            isLast={currentCardIndex === vocab.length - 1} 
          />
        )}

        {state === 'testing' && activeQuestion && (
          <TestQuestion 
            question={activeQuestion} 
            onAnswer={handleAnswer} 
            onNext={handleNextQuestion}
            isReviewMode={reviewIds.length > 0}
            cefrLevel={appConfig?.level || 'B1'}
          />
        )}

        {state === 'results' && (
          <ResultsView 
            questions={questions} 
            userAnswers={userAnswers} 
            onRetry={handleRetry}
            onNewTest={handleNewTest}
            onHome={handleHome}
          />
        )}

      </main>
    </div>
  );
};

export default App;
