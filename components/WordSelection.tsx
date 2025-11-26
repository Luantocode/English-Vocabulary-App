
import React, { useState } from 'react';
import { WordPoolItem } from '../types';
import { ArrowRight, CheckSquare, Square } from 'lucide-react';

interface Props {
  pool: WordPoolItem[];
  topic: string;
  onConfirm: (selectedWords: string[]) => void;
  onCancel: () => void;
}

const WordSelection: React.FC<Props> = ({ pool, topic, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleWord = (term: string) => {
    setSelected(prev => 
      prev.includes(term) 
        ? prev.filter(t => t !== term) 
        : [...prev, term]
    );
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onConfirm(selected);
    }
  };

  const renderColumn = (title: string, categoryKey: string, colorClass: string) => {
      // Filter words belonging to this category
      const words = pool.filter(w => w.category === categoryKey);
      
      return (
          <div className="flex flex-col h-full min-w-[180px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`px-3 py-2 font-bold text-center text-white text-sm ${colorClass}`}>
                  {title} <span className="opacity-75 text-xs ml-1">({words.length})</span>
              </div>
              <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                  {words.map((item, idx) => {
                      const isSelected = selected.includes(item.term);
                      return (
                          <div 
                            key={idx}
                            onClick={() => toggleWord(item.term)}
                            className={`px-2 py-1.5 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                                isSelected 
                                ? 'bg-indigo-50 border-indigo-300' 
                                : 'bg-white border-transparent hover:bg-gray-50'
                            }`}
                          >
                              <div className="shrink-0 text-indigo-600">
                                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-200" />}
                              </div>
                              <span className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                                  {item.term}
                              </span>
                          </div>
                      );
                  })}
                  {words.length === 0 && (
                      <p className="text-center text-gray-400 text-xs py-4 italic">Empty</p>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="w-full max-w-[95vw] bg-white rounded-2xl shadow-xl p-4 border border-gray-100 flex flex-col h-[90vh]">
      <div className="mb-2 flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Select Words to Learn</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Topic:</span>
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium text-sm">{topic}</span>
            </div>
        </div>
        <div className="text-right">
             <p className="text-gray-600 font-medium text-sm">
                Selected: <span className="text-indigo-600 font-bold text-lg">{selected.length}</span>
             </p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-2">
          {/* Fixed 5-column grid layout - compact */}
          <div className="grid grid-cols-5 gap-2 h-full min-w-[900px]">
              {renderColumn("Nouns", "Nouns", "bg-blue-500")}
              {renderColumn("Verbs", "Verbs", "bg-red-500")}
              {renderColumn("Adjectives", "Adjectives", "bg-green-500")}
              {renderColumn("Adverbs", "Adverbs", "bg-amber-500")}
              {renderColumn("Mix / Idioms", "Mix (Other)", "bg-purple-500")}
          </div>
      </div>

      <div className="mt-2 flex gap-4 pt-3 border-t border-gray-100 flex-shrink-0">
         <button
            onClick={onCancel}
            className="px-6 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
         >
            Back
         </button>
         <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
         >
            Start Learning ({selected.length}) <ArrowRight size={18} />
         </button>
      </div>
    </div>
  );
};

export default WordSelection;
