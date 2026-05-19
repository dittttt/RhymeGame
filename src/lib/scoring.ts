export type ScoreBreakdown = {
  total: number;
  lineCount: number;
  uniqueWords: number;
  rhymeMatches: number;
  promptHits: number;
  feedback: string[];
};

const WORD_RE = /[a-zA-Z']+/g;

function words(text: string): string[] {
  return text.toLowerCase().match(WORD_RE) ?? [];
}

function lineEndings(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => words(line).at(-1) ?? "")
    .filter(Boolean)
    .map((word) => word.slice(-3));
}

export function scoreSubmission(submission: string, prompt: string): ScoreBreakdown {
  const clean = submission.trim();
  const feedback: string[] = [];

  if (!clean) {
    return {
      total: 0,
      lineCount: 0,
      uniqueWords: 0,
      rhymeMatches: 0,
      promptHits: 0,
      feedback: ["Drop at least a few bars before the timer ends."],
    };
  }

  const submittedWords = words(clean);
  const uniqueWords = new Set(submittedWords).size;
  const lines = clean.split(/\n+/).filter((line) => line.trim().length > 0);
  const endings = lineEndings(clean);
  const endingCounts = endings.reduce<Record<string, number>>((acc, ending) => {
    acc[ending] = (acc[ending] ?? 0) + 1;
    return acc;
  }, {});
  const rhymeMatches = Object.values(endingCounts).reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0,
  );
  const promptWords = words(prompt);
  const promptHits = promptWords.filter((word) => submittedWords.includes(word)).length;

  const lineScore = Math.min(lines.length * 8, 32);
  const uniqueScore = Math.min(uniqueWords * 1.5, 30);
  const rhymeScore = Math.min(rhymeMatches * 10, 25);
  const promptScore = Math.min(promptHits * 8, 16);
  const total = Math.round(lineScore + uniqueScore + rhymeScore + promptScore);

  if (lines.length >= 4) feedback.push("Good volume — you wrote a full pocket of bars.");
  else feedback.push("Try to get at least four lines down next round.");

  if (rhymeMatches > 0) feedback.push("Nice, your line endings created a rhyme pattern.");
  else feedback.push("Push harder on repeated sounds at the end of each line.");

  if (promptHits > 0) feedback.push("You connected the verse back to the prompt.");
  else feedback.push("Mention the prompt directly for bonus points.");

  return {
    total,
    lineCount: lines.length,
    uniqueWords,
    rhymeMatches,
    promptHits,
    feedback,
  };
}
