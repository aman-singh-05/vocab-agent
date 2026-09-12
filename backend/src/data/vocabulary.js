/**
 * Curated vocabulary dataset for the voice learning agent.
 * 30+ words distributed across beginner, intermediate, and advanced levels.
 */

const vocabulary = [
  // ── BEGINNER ──────────────────────────────────────────────────────────────
  {
    id: "b001",
    word: "grateful",
    definition: "Feeling or showing thanks for something good that has happened.",
    example: "She was grateful for the help her friend gave her.",
    difficulty: "beginner",
    context: "Used when expressing appreciation in everyday situations.",
    synonyms: ["thankful", "appreciative"],
    reviewPriority: 1,
  },
  {
    id: "b002",
    word: "curious",
    definition: "Having a strong desire to learn or know about something.",
    example: "The curious child asked many questions about the stars.",
    difficulty: "beginner",
    context: "Describes a personality trait or a feeling in a moment.",
    synonyms: ["inquisitive", "interested"],
    reviewPriority: 1,
  },
  {
    id: "b003",
    word: "patient",
    definition: "Able to wait calmly without getting upset or frustrated.",
    example: "You need to be patient while learning a new skill.",
    difficulty: "beginner",
    context: "Used to describe someone's behavior when waiting or dealing with difficulty.",
    synonyms: ["calm", "tolerant"],
    reviewPriority: 1,
  },
  {
    id: "b004",
    word: "brave",
    definition: "Ready to face danger or difficulty without showing fear.",
    example: "It was brave of her to speak in front of the whole school.",
    difficulty: "beginner",
    context: "Describes courageous actions in everyday or dramatic situations.",
    synonyms: ["courageous", "bold"],
    reviewPriority: 1,
  },
  {
    id: "b005",
    word: "reliable",
    definition: "Consistently doing what you say you will do; dependable.",
    example: "My old car is very reliable and never breaks down.",
    difficulty: "beginner",
    context: "Used for people, machines, or systems that can be trusted.",
    synonyms: ["dependable", "trustworthy"],
    reviewPriority: 1,
  },
  {
    id: "b006",
    word: "cheerful",
    definition: "Noticeably happy and optimistic.",
    example: "The cheerful teacher made every class enjoyable.",
    difficulty: "beginner",
    context: "Describes someone's mood or demeanor.",
    synonyms: ["happy", "upbeat"],
    reviewPriority: 1,
  },
  {
    id: "b007",
    word: "honest",
    definition: "Telling the truth and not deceiving or cheating others.",
    example: "He was always honest, even when the truth was uncomfortable.",
    difficulty: "beginner",
    context: "A core character trait in personal and professional life.",
    synonyms: ["truthful", "sincere"],
    reviewPriority: 1,
  },
  {
    id: "b008",
    word: "stubborn",
    definition: "Refusing to change your opinion or behavior despite pressure.",
    example: "She was too stubborn to admit she had made a mistake.",
    difficulty: "beginner",
    context: "Often used to describe someone who resists advice or change.",
    synonyms: ["obstinate", "headstrong"],
    reviewPriority: 2,
  },
  {
    id: "b009",
    word: "eager",
    definition: "Very excited and interested to do something.",
    example: "The students were eager to start the science experiment.",
    difficulty: "beginner",
    context: "Conveys enthusiasm before starting an activity.",
    synonyms: ["enthusiastic", "keen"],
    reviewPriority: 1,
  },
  {
    id: "b010",
    word: "gentle",
    definition: "Careful and kind in the way you treat people or things.",
    example: "Please be gentle with the newborn kitten.",
    difficulty: "beginner",
    context: "Used for physical handling or speaking in a soft, kind way.",
    synonyms: ["tender", "mild"],
    reviewPriority: 1,
  },

  // ── INTERMEDIATE ──────────────────────────────────────────────────────────
  {
    id: "i001",
    word: "reluctant",
    definition: "Not really willing to do something; doing it unwillingly.",
    example: "I was reluctant to join the competition because I wasn't prepared.",
    difficulty: "intermediate",
    context: "Describes hesitation before an action due to doubt or discomfort.",
    synonyms: ["hesitant", "unwilling"],
    reviewPriority: 2,
  },
  {
    id: "i002",
    word: "ambiguous",
    definition: "Open to more than one interpretation; not clear in meaning.",
    example: "The instructions were ambiguous, so nobody knew what to do.",
    difficulty: "intermediate",
    context: "Used for language, situations, or signals that are unclear.",
    synonyms: ["vague", "unclear"],
    reviewPriority: 2,
  },
  {
    id: "i003",
    word: "diligent",
    definition: "Careful and hard-working, putting in serious effort over time.",
    example: "She was diligent in her studies and always completed her work on time.",
    difficulty: "intermediate",
    context: "Describes a consistent work ethic rather than a single effort.",
    synonyms: ["industrious", "hardworking"],
    reviewPriority: 2,
  },
  {
    id: "i004",
    word: "empathy",
    definition: "The ability to understand and share the feelings of another person.",
    example: "Good teachers show empathy when a student is struggling.",
    difficulty: "intermediate",
    context: "Central to emotional intelligence, leadership, and relationships.",
    synonyms: ["compassion", "understanding"],
    reviewPriority: 2,
  },
  {
    id: "i005",
    word: "persistent",
    definition: "Continuing to try something despite difficulty or opposition.",
    example: "He was persistent in his job search even after many rejections.",
    difficulty: "intermediate",
    context: "Positive trait implying determination over time.",
    synonyms: ["tenacious", "determined"],
    reviewPriority: 2,
  },
  {
    id: "i006",
    word: "pragmatic",
    definition: "Dealing with things in a practical, realistic way rather than following fixed theories.",
    example: "She took a pragmatic approach and chose the option that actually worked.",
    difficulty: "intermediate",
    context: "Used in decision-making, business, and everyday problem-solving.",
    synonyms: ["practical", "realistic"],
    reviewPriority: 2,
  },
  {
    id: "i007",
    word: "eloquent",
    definition: "Able to express ideas clearly and effectively in speech or writing.",
    example: "His eloquent speech moved everyone in the audience.",
    difficulty: "intermediate",
    context: "Used to praise effective communication, especially public speaking.",
    synonyms: ["articulate", "fluent"],
    reviewPriority: 2,
  },
  {
    id: "i008",
    word: "resilient",
    definition: "Able to recover quickly from difficulties or setbacks.",
    example: "After losing her job, she proved resilient and started her own business.",
    difficulty: "intermediate",
    context: "Increasingly used in mental health, business, and leadership contexts.",
    synonyms: ["tough", "adaptable"],
    reviewPriority: 2,
  },
  {
    id: "i009",
    word: "subtle",
    definition: "Not obvious or strong; delicate and easily missed.",
    example: "There was a subtle difference between the two shades of blue.",
    difficulty: "intermediate",
    context: "Used for differences, hints, or behaviors that are hard to detect.",
    synonyms: ["understated", "delicate"],
    reviewPriority: 3,
  },
  {
    id: "i010",
    word: "versatile",
    definition: "Able to adapt to many different functions, activities, or situations.",
    example: "She is a versatile musician who can play five instruments.",
    difficulty: "intermediate",
    context: "Used to describe people, tools, or skills with wide applicability.",
    synonyms: ["adaptable", "flexible"],
    reviewPriority: 2,
  },
  {
    id: "i011",
    word: "candid",
    definition: "Truthful and straightforward, especially about difficult topics.",
    example: "Let me be candid with you — this plan has serious risks.",
    difficulty: "intermediate",
    context: "Used when someone speaks openly, sometimes surprisingly so.",
    synonyms: ["frank", "direct"],
    reviewPriority: 2,
  },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  {
    id: "a001",
    word: "ephemeral",
    definition: "Lasting for only a very short time.",
    example: "Fame is often ephemeral — celebrated today, forgotten tomorrow.",
    difficulty: "advanced",
    context: "Common in philosophy, art, and discussions about time and impermanence.",
    synonyms: ["transient", "fleeting"],
    reviewPriority: 3,
  },
  {
    id: "a002",
    word: "sycophantic",
    definition: "Behaving in an excessively flattering way to gain favor; overly complimentary.",
    example: "His sycophantic praise of the boss made his colleagues uncomfortable.",
    difficulty: "advanced",
    context: "Used critically in professional and political contexts.",
    synonyms: ["obsequious", "fawning"],
    reviewPriority: 3,
  },
  {
    id: "a003",
    word: "juxtaposition",
    definition: "Placing two contrasting things side by side for effect.",
    example: "The film used juxtaposition, cutting between scenes of poverty and wealth.",
    difficulty: "advanced",
    context: "Common in literature, art, film criticism, and rhetoric.",
    synonyms: ["contrast", "comparison"],
    reviewPriority: 3,
  },
  {
    id: "a004",
    word: "equivocal",
    definition: "Open to more than one interpretation and deliberately vague.",
    example: "The politician gave an equivocal answer to avoid committing to a position.",
    difficulty: "advanced",
    context: "Used when someone is intentionally unclear, often in a deceptive way.",
    synonyms: ["ambiguous", "noncommittal"],
    reviewPriority: 3,
  },
  {
    id: "a005",
    word: "perfidious",
    definition: "Guilty of treachery or betrayal; deliberately faithless.",
    example: "The perfidious advisor secretly sold information to the enemy.",
    difficulty: "advanced",
    context: "Literary and formal, used to describe deep betrayal.",
    synonyms: ["treacherous", "deceitful"],
    reviewPriority: 3,
  },
  {
    id: "a006",
    word: "laconic",
    definition: "Using very few words; brief and to the point.",
    example: "When asked how the battle went, his laconic reply was simply, 'We won.'",
    difficulty: "advanced",
    context: "Often admired in writing and speech as a sign of confidence and clarity.",
    synonyms: ["terse", "concise"],
    reviewPriority: 3,
  },
  {
    id: "a007",
    word: "obfuscate",
    definition: "To make something unclear or difficult to understand, usually deliberately.",
    example: "The report was full of jargon designed to obfuscate the real findings.",
    difficulty: "advanced",
    context: "Used in politics, corporate writing, and criticism of unclear communication.",
    synonyms: ["obscure", "confuse"],
    reviewPriority: 3,
  },
  {
    id: "a008",
    word: "pedantic",
    definition: "Excessively concerned with minor rules or details, often annoyingly so.",
    example: "He was so pedantic that he corrected every small grammar error.",
    difficulty: "advanced",
    context: "Used to describe someone who prioritizes rules over practical understanding.",
    synonyms: ["nitpicking", "fussy"],
    reviewPriority: 3,
  },
  {
    id: "a009",
    word: "magnanimous",
    definition: "Very generous and forgiving, especially toward a rival or enemy.",
    example: "Despite winning the argument, she was magnanimous and praised her opponent.",
    difficulty: "advanced",
    context: "Used to describe noble, generous behavior especially in conflict.",
    synonyms: ["generous", "noble"],
    reviewPriority: 3,
  },
  {
    id: "a010",
    word: "insidious",
    definition: "Proceeding in a gradual, subtle way but with harmful effects.",
    example: "The insidious effects of misinformation spread slowly through the community.",
    difficulty: "advanced",
    context: "Used for dangers, diseases, or problems that build up unnoticed.",
    synonyms: ["subtle", "stealthy"],
    reviewPriority: 3,
  },
];

/**
 * Returns words filtered by difficulty level.
 * @param {string} difficulty - 'beginner' | 'intermediate' | 'advanced'
 * @returns {Array}
 */
function getWordsByDifficulty(difficulty) {
  return vocabulary.filter((w) => w.difficulty === difficulty);
}

/**
 * Returns a shuffled subset of words for a session.
 * @param {string} difficulty
 * @param {number} count
 * @returns {Array}
 */
function getSessionWords(difficulty, count = 5) {
  const pool = getWordsByDifficulty(difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Returns a word by ID.
 */
function getWordById(id) {
  return vocabulary.find((w) => w.id === id) || null;
}

module.exports = { vocabulary, getWordsByDifficulty, getSessionWords, getWordById };
