
import React, { useEffect, useState } from 'react';
import { Word } from '../types';
import { Volume2, Book, Sparkles, Languages, Eye } from 'lucide-react';

interface Props {
  word: Word;
  onNext: () => void;
  isLast: boolean;
}

const LearnCard: React.FC<Props> = ({ word, onNext, isLast }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    setShowTranslation({}); // Reset translations on new word
  }, [word]);
  
  const playAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.term);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;

      const preferredVoice = voices.find(v => v.name === 'Google US English') ||
                             voices.find(v => v.name.includes('Samantha')) ||
                             voices.find(v => v.name.includes('Microsoft Zira')) ||
                             voices.find(v => v.lang === 'en-US');

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleTranslation = (key: string) => {
    setShowTranslation(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllTranslations = () => {
    const mainKeys = ['term', 'meaning'];
    const exampleKeys = word.examples.map((_, i) => `example-${i}`);
    const allKeys = [...mainKeys, ...exampleKeys];
    
    const areAllVisible = allKeys.every(key => showTranslation[key]);
    
    const newState: Record<string, boolean> = {};
    allKeys.forEach(key => {
        newState[key] = !areAllVisible;
    });
    setShowTranslation(newState);
  };

  const hasTranslation = !!word.termVi;
  const areAnyTranslationsVisible = Object.values(showTranslation).some(v => v);

  const renderStyledText = (text: string) => {
    if (!text) return null;
    // Split by double asterisks, handling optional spaces inside or around
    // Regex matches **content**
    const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove asterisks and trim any accidental whitespace inside them
        const content = part.slice(2, -2).trim();
        if (content.length > 0) {
            return <strong key={index} className="text-amber-700 bg-amber-100 px-1 rounded">{content}</strong>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-gray-100">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
        <div className="flex justify-between items-start mb-4">
            {hasTranslation && (
                <button 
                    onClick={toggleAllTranslations}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium transition-colors backdrop-blur-sm ml-auto"
                >
                    <Eye size={14} />
                    {areAnyTranslationsVisible ? "Hide Translations" : "Show All Translations"}
                </button>
            )}
        </div>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-5xl font-bold mb-2 tracking-tight">{word.term}</h2>
              {hasTranslation && (
                <button 
                  onClick={() => toggleTranslation('term')}
                  className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors mt-1"
                  title="Show translation"
                >
                  <Languages size={16} />
                </button>
              )}
            </div>
            
            {showTranslation['term'] && word.termVi && (
                 <p className="text-indigo-100 text-xl font-medium italic mb-2 animate-fade-in">{word.termVi}</p>
            )}

            <div className="flex items-center gap-3 opacity-90 flex-wrap mt-2">
              <span className="font-mono text-lg bg-white/20 px-2 py-1 rounded">{word.pronunciation}</span>
              <span className="italic font-medium text-white/80 border border-white/30 px-2 py-1 rounded text-sm">{word.partOfSpeech}</span>
            </div>
          </div>
          <button 
            onClick={playAudio}
            className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-8 h-8 opacity-100" />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Meaning Section */}
        <div className="group relative">
          <div className="flex items-center justify-between text-indigo-600 font-semibold mb-2">
            <div className="flex items-center gap-2">
              <Book size={20} />
              <h3>Meaning</h3>
            </div>
            {hasTranslation && (
                <button 
                  onClick={() => toggleTranslation('meaning')}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  <Languages size={14} /> {showTranslation['meaning'] ? 'Hide' : 'Translate'}
                </button>
            )}
          </div>
          <p className="text-gray-800 text-lg leading-relaxed">{word.meaning}</p>
          {showTranslation['meaning'] && word.meaningVi && (
              <p className="text-indigo-600 italic mt-2 pl-4 border-l-2 border-indigo-200 animate-fade-in">{word.meaningVi}</p>
          )}
        </div>

        {/* Examples Section */}
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 relative">
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <Sparkles size={18} />
                <h3>Context & Collocations</h3>
             </div>
          </div>
          
          <ul className="space-y-6">
              {word.examples.map((ex, idx) => (
                  <li key={idx} className="relative pl-4">
                      <span className="absolute left-0 top-3 w-1.5 h-1.5 bg-amber-300 rounded-full"></span>
                      <div className="flex items-start justify-between gap-3">
                          <p className="text-gray-800 text-lg italic leading-relaxed flex-1">
                              {renderStyledText(ex)}
                          </p>
                          {hasTranslation && (
                            <button 
                                onClick={() => toggleTranslation(`example-${idx}`)}
                                className="shrink-0 p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                                title="Translate this sentence"
                            >
                                <Languages size={18} />
                            </button>
                          )}
                      </div>
                      
                      {showTranslation[`example-${idx}`] && word.examplesVi && word.examplesVi[idx] && (
                          <p className="text-amber-700 text-sm italic mt-2 animate-fade-in bg-amber-100/50 p-3 rounded-lg border border-amber-200">
                              {renderStyledText(word.examplesVi[idx])}
                          </p>
                      )}
                  </li>
              ))}
          </ul>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-gray-900 hover:bg-black text-white text-lg font-semibold py-4 rounded-xl shadow-lg transition-all mt-4"
        >
          {isLast ? "Start Quiz" : "Next Word"}
        </button>
      </div>
    </div>
  );
};

export default LearnCard;
