const express = require("express");
const router = express.Router();
const { vocabulary, getWordsByDifficulty } = require("../data/vocabulary");

// GET /api/vocabulary — all words
router.get("/", (req, res) => {
  const { difficulty } = req.query;
  if (difficulty) {
    const words = getWordsByDifficulty(difficulty);
    return res.json(words);
  }
  return res.json(vocabulary);
});

// GET /api/vocabulary/count — count by difficulty
router.get("/count", (req, res) => {
  const counts = {
    beginner: vocabulary.filter((w) => w.difficulty === "beginner").length,
    intermediate: vocabulary.filter((w) => w.difficulty === "intermediate").length,
    advanced: vocabulary.filter((w) => w.difficulty === "advanced").length,
    total: vocabulary.length,
  };
  return res.json(counts);
});

module.exports = router;
