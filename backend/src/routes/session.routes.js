const express = require("express");
const router = express.Router();
const {
  startSession,
  respondToWord,
  nextWord,
  endSession,
  getSession,
} = require("../controllers/session.controller");

router.post("/start", startSession);
router.get("/:id", getSession);
router.post("/:id/respond", respondToWord);
router.post("/:id/next-word", nextWord);
router.post("/:id/end", endSession);

module.exports = router;
