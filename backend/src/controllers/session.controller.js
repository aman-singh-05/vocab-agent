const { v4: uuidv4 } = require("uuid");
const { getSessionWords } = require("../data/vocabulary");
const {
  generateWordIntroduction,
  processLearnerResponse,
  generateSessionSummary,
} = require("../services/ai.service");

// In-memory session store (sufficient for prototype; replace with Redis/DB for production)
const sessions = new Map();

/**
 * POST /api/sessions/start
 * Creates a new learning session.
 */
async function startSession(req, res) {
  try {
    const { difficulty = "intermediate", wordCount = 5 } = req.body;

    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty. Choose beginner, intermediate, or advanced." });
    }

    const count = Math.min(Math.max(parseInt(wordCount) || 5, 3), 10);
    const words = getSessionWords(difficulty, count);

    if (words.length === 0) {
      return res.status(500).json({ error: "No words available for this difficulty." });
    }

    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      difficulty,
      words,
      currentWordIndex: 0,
      startedAt: Date.now(),
      conversationHistory: [],
      wordResults: words.map((w) => ({
        wordId: w.id,
        word: w.word,
        attempts: 0,
        correct: false,
        needsReview: false,
      })),
    };

    sessions.set(sessionId, session);

    // Generate introduction for the first word
    const firstWord = words[0];
    const introduction = await generateWordIntroduction(firstWord);

    // Add to conversation history
    session.conversationHistory.push({
      role: "assistant",
      content: introduction,
    });

    return res.status(201).json({
      sessionId,
      difficulty,
      totalWords: words.length,
      currentWord: {
        index: 0,
        ...firstWord,
      },
      introduction,
      progress: {
        current: 1,
        total: words.length,
        correct: 0,
        toReview: 0,
      },
    });
  } catch (err) {
    console.error("[startSession]", err);
    if (err?.status === 401 || err?.message?.includes("API key")) {
      return res.status(500).json({ error: "AI service configuration error. Please check the API key." });
    }
    return res.status(500).json({ error: "Failed to start session. Please try again." });
  }
}

/**
 * POST /api/sessions/:id/respond
 * Processes a learner's spoken response and returns tutor feedback.
 */
async function respondToWord(req, res) {
  try {
    const { id } = req.params;
    const { userMessage } = req.body;

    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return res.status(400).json({ error: "Please provide your spoken response." });
    }

    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found. It may have expired." });
    }

    const currentWord = session.words[session.currentWordIndex];
    if (!currentWord) {
      return res.status(400).json({ error: "No current word in session." });
    }

    // Track attempt
    const wordResult = session.wordResults[session.currentWordIndex];
    wordResult.attempts += 1;

    // Add user message to history
    session.conversationHistory.push({ role: "user", content: userMessage.trim() });

    // Keep history trimmed to last 10 messages (5 exchanges) to control token usage
    const recentHistory = session.conversationHistory.slice(-10);

    const { reply, wordUsedCorrectly, readyForNext } = await processLearnerResponse(
      currentWord,
      recentHistory.slice(0, -1), // history without the message just added
      userMessage.trim()
    );

    // Add assistant reply to history
    session.conversationHistory.push({ role: "assistant", content: reply });

    // Update word result
    if (wordUsedCorrectly && !wordResult.correct) {
      wordResult.correct = true;
    }
    if (wordResult.attempts >= 3 && !wordResult.correct) {
      wordResult.needsReview = true;
    }

    // Calculate progress
    const correct = session.wordResults.filter((r) => r.correct).length;
    const toReview = session.wordResults.filter((r) => r.needsReview).length;

    return res.json({
      reply,
      wordUsedCorrectly,
      readyForNext,
      currentWord: {
        index: session.currentWordIndex,
        ...currentWord,
      },
      progress: {
        current: session.currentWordIndex + 1,
        total: session.words.length,
        correct,
        toReview,
      },
    });
  } catch (err) {
    console.error("[respondToWord]", err);
    if (err?.status === 429) {
      return res.status(429).json({ error: "AI service is busy. Please wait a moment and try again." });
    }
    if (err?.status === 401) {
      return res.status(500).json({ error: "AI service configuration error." });
    }
    return res.status(500).json({ error: "Failed to process your response. Please try again." });
  }
}

/**
 * POST /api/sessions/:id/next-word
 * Advances to the next vocabulary word and returns its introduction.
 */
async function nextWord(req, res) {
  try {
    const { id } = req.params;
    const session = sessions.get(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const nextIndex = session.currentWordIndex + 1;

    if (nextIndex >= session.words.length) {
      return res.status(400).json({ error: "No more words in this session. Please end the session." });
    }

    session.currentWordIndex = nextIndex;
    session.conversationHistory = []; // Reset history for new word

    const nextWordObj = session.words[nextIndex];
    const introduction = await generateWordIntroduction(nextWordObj);

    session.conversationHistory.push({ role: "assistant", content: introduction });

    const correct = session.wordResults.filter((r) => r.correct).length;
    const toReview = session.wordResults.filter((r) => r.needsReview).length;

    return res.json({
      currentWord: {
        index: nextIndex,
        ...nextWordObj,
      },
      introduction,
      progress: {
        current: nextIndex + 1,
        total: session.words.length,
        correct,
        toReview,
      },
    });
  } catch (err) {
    console.error("[nextWord]", err);
    return res.status(500).json({ error: "Failed to load next word. Please try again." });
  }
}

/**
 * POST /api/sessions/:id/end
 * Ends the session and returns the summary.
 */
async function endSession(req, res) {
  try {
    const { id } = req.params;
    const session = sessions.get(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const durationMs = Date.now() - session.startedAt;
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    const wordsAttempted = session.wordResults.filter((r) => r.attempts > 0).length;
    const wordsCorrect = session.wordResults.filter((r) => r.correct).length;
    const wordsToReview = session.wordResults.filter((r) => r.needsReview).map((r) => r.word);
    const accuracy = wordsAttempted > 0 ? Math.round((wordsCorrect / wordsAttempted) * 100) : 0;

    const recommendation = await generateSessionSummary({
      wordsAttempted,
      wordsCorrect,
      wordsToReview,
      difficulty: session.difficulty,
      durationMinutes,
    });

    const summary = {
      sessionId: id,
      difficulty: session.difficulty,
      totalWords: session.words.length,
      wordsAttempted,
      wordsLearned: wordsCorrect,
      wordsMastered: session.wordResults.filter((r) => r.correct && r.attempts === 1).length,
      wordsToReview,
      accuracy,
      durationMinutes,
      recommendation,
      wordResults: session.wordResults,
    };

    // Clean up session from memory
    sessions.delete(id);

    return res.json(summary);
  } catch (err) {
    console.error("[endSession]", err);
    return res.status(500).json({ error: "Failed to generate session summary." });
  }
}

/**
 * GET /api/sessions/:id
 * Returns current session state (for reconnection).
 */
async function getSession(req, res) {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found or expired." });
  }

  const currentWord = session.words[session.currentWordIndex];
  const correct = session.wordResults.filter((r) => r.correct).length;
  const toReview = session.wordResults.filter((r) => r.needsReview).length;

  return res.json({
    sessionId: id,
    difficulty: session.difficulty,
    currentWord: { index: session.currentWordIndex, ...currentWord },
    progress: {
      current: session.currentWordIndex + 1,
      total: session.words.length,
      correct,
      toReview,
    },
    lastMessage: session.conversationHistory[session.conversationHistory.length - 1]?.content || "",
  });
}

module.exports = { startSession, respondToWord, nextWord, endSession, getSession };
