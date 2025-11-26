export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CONGRATS_PHRASES = [
  "Outstanding work!",
  "Spot on!",
  "Excellent!",
  "Perfect!",
  "You nailed it!",
  "Brilliant!",
  "That's correct!"
];

export const SYMPATHY_PHRASES = [
  "Not quite, but nice try!",
  "Close, but give it another go!",
  "Tricky one, keep learning!",
  "Don't worry, you'll get it next time!",
  "Oops! Review the definition.",
  "Almost there!"
];

export const getRandomCongratulation = () => CONGRATS_PHRASES[Math.floor(Math.random() * CONGRATS_PHRASES.length)];
export const getRandomSympathy = () => SYMPATHY_PHRASES[Math.floor(Math.random() * SYMPATHY_PHRASES.length)];
