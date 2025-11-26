import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AppConfig, Word, Question, BloomLevel, VocabResponse, MatchingPair, WordPoolItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to create dynamic schema based on level
const createWordSchema = (): Schema => {
  const properties: Record<string, Schema> = {
    term: { type: Type.STRING },
    partOfSpeech: { type: Type.STRING, description: "e.g. noun, verb, adj" },
    meaning: { type: Type.STRING, description: "Clear definition using simple A1-B1 level vocabulary only" },
    pronunciation: { type: Type.STRING, description: "IPA format" },
    // Changed to array of strings for multiple examples
    examples: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Exactly 3 example sentences. Each sentence must use the target word in a different common collocation or context. Wrap the collocation phrase in **double asterisks**." 
    },
    termVi: { type: Type.STRING, description: "Vietnamese translation of the term" },
    meaningVi: { type: Type.STRING, description: "Vietnamese translation of the meaning" },
    examplesVi: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Vietnamese translations of the 3 example sentences, matching order." 
    }
  };

  const required = ["term", "partOfSpeech", "meaning", "pronunciation", "examples", "termVi", "meaningVi", "examplesVi"];

  return {
    type: Type.OBJECT,
    properties,
    required
  };
};

// Helper to fetch a specific batch of words
const fetchWordBatch = async (level: string, topic: string, partOfSpeech: string, count: number): Promise<string[]> => {
    const model = "gemini-2.5-flash";
    const prompt = `
      Generate a list of EXACTLY ${count} distinct English **${partOfSpeech}** suitable for CEFR Level ${level}.
      Topic: "${topic}".
      
      Rules:
      1. Provide ONLY the English term.
      2. Ensure all words are valid ${partOfSpeech}.
      3. Do NOT provide definitions or translations. Just the words.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { term: { type: Type.STRING } },
            required: ["term"]
          }
        }
      },
      required: ["items"]
    };

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      if(response.text) {
         const data = JSON.parse(response.text);
         const items = data.items || [];
         return items.map((i: any) => i.term || i);
      }
      return [];
    } catch (e) {
      console.error(`Failed to fetch batch for ${partOfSpeech}`, e);
      return [];
    }
};

export const generateWordPool = async (level: string, topic?: string): Promise<{ topic: string, pool: WordPoolItem[] }> => {
  // 1. Determine Topic first if random
  let finalTopic = topic;
  if (!finalTopic || finalTopic.trim() === '') {
      const model = "gemini-2.5-flash";
      const topicPrompt = `Suggest ONE specific, interesting topic for English vocabulary learning at CEFR Level ${level}. (e.g., "Space Travel", "Digital Privacy", "Renaissance Art"). Output JSON: { "topic": "string" }`;
      const topicResp = await ai.models.generateContent({
          model, contents: topicPrompt, config: { responseMimeType: "application/json" }
      });
      if (topicResp.text) {
          finalTopic = JSON.parse(topicResp.text).topic;
      } else {
          finalTopic = "General Knowledge";
      }
  }

  // Determine content for 5th column based on topic keywords
  const topicLower = finalTopic!.toLowerCase();
  const isGrammarTopic = topicLower.includes('grammar') || topicLower.includes('structure') || topicLower.includes('connector') || topicLower.includes('preposition');
  
  const fifthCategoryLabel = isGrammarTopic 
      ? "Function Words (Conjunctions, Prepositions, etc.)"
      : "Idioms & Fixed Expressions";

  // 2. Execute 5 Parallel Calls to guarantee distribution
  const [nounList, verbList, adjList, advList, mixList] = await Promise.all([
      fetchWordBatch(level, finalTopic!, "Nouns", 10),
      fetchWordBatch(level, finalTopic!, "Verbs", 10),
      fetchWordBatch(level, finalTopic!, "Adjectives", 10),
      fetchWordBatch(level, finalTopic!, "Adverbs", 10),
      fetchWordBatch(level, finalTopic!, fifthCategoryLabel, 10)
  ]);

  // 3. Construct WordPoolItems with categories
  const pool: WordPoolItem[] = [
      ...nounList.map(t => ({ term: t, category: 'Nouns' })),
      ...verbList.map(t => ({ term: t, category: 'Verbs' })),
      ...adjList.map(t => ({ term: t, category: 'Adjectives' })),
      ...advList.map(t => ({ term: t, category: 'Adverbs' })),
      ...mixList.map(t => ({ term: t, category: 'Mix (Other)' }))
  ];

  return {
      topic: finalTopic!,
      pool: pool
  };
};

export const generateVocabulary = async (config: AppConfig): Promise<VocabResponse> => {
  const model = "gemini-2.5-flash";
  const count = config.numWords || 5;
  const level = config.level || "B1";
  
  const wordSchema = createWordSchema();

  const vocabResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The specific topic chosen for this list" },
      words: { type: Type.ARRAY, items: wordSchema }
    },
    required: ["topic", "words"]
  };
  
  let prompt = `Generate a list of ${count} English vocabulary words`;
  if (level) prompt += ` suitable for CEFR Level ${level}.`;
  
  if (config.topic) {
    prompt += ` related to the topic: "${config.topic}".`;
  } else {
    prompt += ` related to a RANDOMLY CHOSEN specific topic.`;
  }

  if (config.targetWords) prompt += ` specifically using these words: ${config.targetWords}.`;
  
  prompt += ` Include meaning, IPA pronunciation, part of speech, and 3 distinct example sentences for each word.
  
  IMPORTANT Rules:
  1. **Meaning**: Explain the definition using VERY SIMPLE vocabulary (A1-B1 level).
  2. **Examples**: 
     - Provide exactly 3 sentences.
     - Each sentence should demonstrate a different **collocation** or usage context.
     - **Highlighting**: In each example, wrap the specific collocation phrase containing the target word in **double asterisks**. 
     - Example: for 'decision', use "He **made a decision** yesterday."
  3. **Translations**: Provide accurate Vietnamese translations for Meaning and all 3 Examples.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: vocabResponseSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as VocabResponse;
    }
    throw new Error("No data returned from API");
  } catch (error) {
    console.error("Vocab Generation Error", error);
    throw error;
  }
};

const questionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      wordTerm: { type: Type.STRING },
      level: { type: Type.STRING, enum: Object.values(BloomLevel) },
      questionText: { type: Type.STRING },
      questionTextVi: { type: Type.STRING, description: "Vietnamese translation of questionText" },
      
      options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Choices for multiple choice questions" },
      optionsVi: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Vietnamese translations of options" },
      
      correctOption: { type: Type.STRING, description: "Correct answer for single select" },
      
      matchingPairs: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                questionText: { type: Type.STRING, description: "The sentence with the gap marked as [[GAP]]" },
                questionTextVi: { type: Type.STRING, description: "Vietnamese translation of the sentence" },
                correctAnswer: { type: Type.STRING, description: "The target word that fits" }
            },
            required: ["id", "questionText", "correctAnswer"]
        }
      },
      
      explanation: { type: Type.STRING, description: "Why the answer is correct" },
      explanationVi: { type: Type.STRING, description: "Vietnamese translation of explanation" }
    },
    required: ["id", "level", "questionText", "questionTextVi"]
  }
};

const sortQuestionsByLevel = (questions: Question[]): Question[] => {
  const levelOrder = [
    BloomLevel.Remember,
    BloomLevel.Understand,
    BloomLevel.Apply,
    BloomLevel.Analyse
  ];
  
  const groupedAndShuffled: Question[] = [];
  
  levelOrder.forEach(lvl => {
    const qs = questions.filter(q => q.level === lvl);
    if (lvl !== BloomLevel.Apply) {
        for (let i = qs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [qs[i], qs[j]] = [qs[j], qs[i]];
        }
    }
    groupedAndShuffled.push(...qs);
  });
  
  return groupedAndShuffled;
};

export const generateTest = async (words: Word[], level: string): Promise<Question[]> => {
  const model = "gemini-2.5-flash";
  
  // Construct a context object that includes terms AND their taught examples
  const wordsContext = words.map(w => ({
      term: w.term,
      examples: w.examples // This contains the collocations with **bolding**
  }));

  const prompt = `
    Create a vocabulary test.
    
    CONTEXT (What the user has learned):
    ${JSON.stringify(wordsContext)}
    
    CRITICAL RULE: While the target words are Level ${level}, ALL instructions, contexts, explanations, and model answers must be in **SIMPLE ENGLISH (A1-B1)**.
    
    Structure the test with the following specific requirements:

    1. **Level 1 (Remember)**: Test meaning. (1 question per word)
       - Question/Options: Simple English.
       - 3 options (1 correct).
       - **STRICT RULE**: All 3 options MUST have **EXACTLY THE SAME WORD COUNT**.

    2. **Level 2 (Understand)**: Contextual Usage. (1 question per word)
       - Question: "Select the sentence that uses the word '[WORD]' correctly."
       - Options: **EXACTLY 3** full sentences.
       - **Constraint**: Only 1 sentence uses the word correctly in context. The other 2 should use it incorrectly.
       - **STRICT RULE**: All 3 sentence options MUST have **EXACTLY THE SAME WORD COUNT**.

    3. **Level 3 (Apply)**: Matching Exercise. (ONE single question object for the whole level)
       - Create ONE question object with \`level: "Apply"\`.
       - \`questionText\`: "Match the words to the correct sentences."
       - \`matchingPairs\`: An array containing one pair for EACH target word.
         - \`questionText\`: A simple sentence with a gap marked **EXACTLY** as \`[[GAP]]\`.
         - \`correctAnswer\`: The exact target word.
         - Do NOT create separate question objects for each word.
    
    4. **Level 4 (Analyse)**: Test collocations. (1 question per word)
       - \`questionText\`: "Select the sentence that uses the word '[WORD]' correctly."
       - \`options\`: 3 sentences.
         - **Option A (Correct)**: You MUST use one of the **EXACT** example sentences from the "CONTEXT" JSON provided above for that specific word.
           - The user must recognize the sentence they just learned.
         - **Option B & C (Incorrect)**: Create 2 sentences where the target word is used with an **INCORRECT** collocation or is **INCOMPATIBLE** with the context.
           - Strategy: Keep the sentence structure similar to the correct option but swap the collocate (e.g. change the verb "make" to "do" if the target is "decision").
           - Ensure the distractors are definitely incorrect usages in standard English.
         - **STRICT RULE**: All 3 sentences MUST have **similar word counts**.
         - **HIGHLIGHTING**: Wrap the collocation phrase in **double asterisks** in ALL options.
         - \`correctOption\`: The full sentence string that is correct.

    5. **Explanations**:
       - \`explanation\`: Must be written in VERY SIMPLE English (A1-B1).

    6. **Translations (REQUIRED)**: 
       - Provide accurate Vietnamese translations for ALL text fields.
       - For Level 4 (Analyse), if the English option uses **bolding**, the Vietnamese translation MUST ALSO use **bolding** for the corresponding phrase.

    Output a JSON array of Question objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        thinkingConfig: { thinkingBudget: 2048 }, 
        maxOutputTokens: 8192 
      }
    });

    if (response.text) {
      let rawQuestions = JSON.parse(response.text) as Question[];
      
      // Post-processing: Clean up Apply questions
      const applyQuestions = rawQuestions.filter(q => q.level === BloomLevel.Apply);
      const allMatchingPairs: MatchingPair[] = [];
      
      applyQuestions.forEach(q => {
          if (q.matchingPairs) {
              q.matchingPairs.forEach(pair => {
                  pair.correctAnswer = pair.correctAnswer.trim();
                  allMatchingPairs.push(pair);
              });
          }
      });
      
      allMatchingPairs.forEach((pair, index) => {
          pair.id = `pair-${index}-${Date.now().toString(36)}`; 
      });

      if (allMatchingPairs.length > 0) {
          rawQuestions = rawQuestions.filter(q => q.level !== BloomLevel.Apply);
          const masterApply: Question = {
              id: 'level-3-master',
              level: BloomLevel.Apply,
              questionText: 'Match the words to the correct sentences.',
              questionTextVi: 'Nối các từ với câu đúng.',
              explanation: 'Match each word to its context.',
              explanationVi: 'Nối mỗi từ với ngữ cảnh của nó.',
              matchingPairs: allMatchingPairs
          };
          rawQuestions.push(masterApply);
      }

      return sortQuestionsByLevel(rawQuestions);
    }
    throw new Error("No test data returned");
  } catch (error) {
    console.error("Test Generation Error", error);
    throw error;
  }
};