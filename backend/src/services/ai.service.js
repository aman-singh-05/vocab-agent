const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || process.env.OPENAI_API_KEY);

/**
 * Get a Gemini model instance.
 */
function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
}

/**
 * System prompt for the vocabulary tutor.
 */
function buildSystemPrompt(word) {
  return `You are Lingo, a friendly and encouraging English vocabulary tutor having a short voice conversation with a learner.

CURRENT WORD: "${word.word}"
DEFINITION: ${word.definition}
EXAMPLE: ${word.example}
DIFFICULTY LEVEL: ${word.difficulty}
SYNONYMS: ${word.synonyms?.join(", ") || "none"}

YOUR ROLE:
- You are teaching this single word through natural conversation.
- Keep every response SHORT — 1 to 3 sentences maximum. This will be spoken aloud.
- Avoid bullet points, markdown, or lists. Speak in plain conversational sentences.
- Be warm, encouraging, and patient. Never condescending.
- When the learner uses the word in a sentence, evaluate whether they used it CORRECTLY.
  - If correct: give brief positive feedback and perhaps suggest a small improvement if relevant.
  - If incorrect or unclear: ask a guiding question rather than immediately giving the answer.
  - If the word is missing entirely: gently remind them to use the word.
- After 2–3 exchanges about a word, you can signal readiness to move on by saying something like "Great work! Ready for the next word?" — but ONLY after a successful or nearly-correct use.
- Vary your conversational openers. Don't start every response the same way.
- If the user seems confused, offer a different example. Never just repeat the definition.
- If the input is empty or unclear, ask them to try again.

IMPORTANT: Respond ONLY in plain spoken English. No symbols, no markdown, no emojis.`;
}

/**
 * Generates the opening introduction for a word.
 */
async function generateWordIntroduction(word) {
  const model = getModel();

  const prompt = `You are Lingo, a friendly English vocabulary tutor. Introduce the word "${word.word}" to a learner.
- Say the word clearly at the start.
- Give a simple explanation of the meaning in 1 sentence.
- Give one natural example sentence.
- Then ask the learner to make their own sentence using the word.
- Keep the whole thing under 4 sentences.
- No markdown, no lists, no emojis. Plain conversational English only.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Processes a learner's spoken response and generates tutor feedback.
 */
async function processLearnerResponse(word, conversationHistory, userMessage) {
  const model = getModel();

  // Build a conversation string for Gemini (it uses a different format)
  const historyText = conversationHistory
    .map((m) => `${m.role === "assistant" ? "Tutor" : "Student"}: ${m.content}`)
    .join("\n");

  const prompt = `${buildSystemPrompt(word)}

CONVERSATION SO FAR:
${historyText}

Student: ${userMessage}

Tutor:`;

  const result = await model.generateContent(prompt);
  const reply = result.response.text().trim();

  // Heuristic signals for UI hints
  const lowerReply = reply.toLowerCase();
  const lowerUser = userMessage.toLowerCase();

  const wordUsedCorrectly =
    lowerUser.includes(word.word.toLowerCase()) &&
    (lowerReply.includes("great") ||
      lowerReply.includes("well done") ||
      lowerReply.includes("good") ||
      lowerReply.includes("exactly") ||
      lowerReply.includes("correct") ||
      lowerReply.includes("perfect") ||
      lowerReply.includes("nice") ||
      lowerReply.includes("wonderful") ||
      lowerReply.includes("excellent"));

  const readyForNext =
    lowerReply.includes("next word") ||
    lowerReply.includes("move on") ||
    lowerReply.includes("ready for the next") ||
    lowerReply.includes("let's continue") ||
    lowerReply.includes("shall we move");

  return { reply, wordUsedCorrectly, readyForNext };
}

/**
 * Generates a session summary and personalized recommendation.
 */
async function generateSessionSummary(sessionData) {
  const { wordsAttempted, wordsCorrect, wordsToReview, difficulty, durationMinutes } = sessionData;
  const model = getModel();

  const prompt = `You are Lingo, a friendly English vocabulary tutor. A learner just finished a practice session:
- Difficulty: ${difficulty}
- Words attempted: ${wordsAttempted}
- Words used correctly: ${wordsCorrect}
- Words needing review: ${wordsToReview.join(", ") || "none"}
- Session duration: approximately ${durationMinutes} minutes

Write a short, warm, personalized recommendation (2–3 sentences) for what they should focus on next.
Be specific to their performance. Be encouraging but honest.
Plain conversational English only. No markdown, no emojis.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = {
  generateWordIntroduction,
  processLearnerResponse,
  generateSessionSummary,
};
