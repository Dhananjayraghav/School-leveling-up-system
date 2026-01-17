
import { Rank, Player, Subject, Chapter, TitleDefinition } from '../types';

// Game Balance Constants
const XP_BASE_REQUIREMENT = 150; // XP needed to go from Lvl 1 to 2
const DIFFICULTY_CURVE = 1.5; // Exponential growth factor (1.5 is standard RPG curve)

/**
 * Calculates the total XP required to complete the *current* level.
 */
export const calculateMaxExp = (level: number): number => {
  return Math.floor(XP_BASE_REQUIREMENT * Math.pow(level, DIFFICULTY_CURVE));
};

export const determineRank = (level: number): Rank => {
  if (level >= 100) return Rank.SSS; // Monarch
  if (level >= 75) return Rank.SS;   // National Level
  if (level >= 50) return Rank.S;
  if (level >= 40) return Rank.A;
  if (level >= 30) return Rank.B;
  if (level >= 20) return Rank.C;
  if (level >= 10) return Rank.D;
  return Rank.E;
};

export const getRankColor = (rank: Rank): string => {
  switch (rank) {
    case Rank.SSS: return 'text-black bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-white shadow-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse'; 
    case Rank.SS: return 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 shadow-yellow-500 drop-shadow-md';
    case Rank.S: return 'text-yellow-400 shadow-yellow-400 drop-shadow-md';
    case Rank.A: return 'text-red-500 shadow-red-500';
    case Rank.B: return 'text-purple-500 shadow-purple-500';
    case Rank.C: return 'text-blue-500 shadow-blue-500';
    case Rank.D: return 'text-green-500 shadow-green-500';
    case Rank.E: return 'text-gray-400 shadow-gray-400';
    default: return 'text-white';
  }
};

// === TITLES SYSTEM ===

export const AVAILABLE_TITLES: TitleDefinition[] = [
  {
    id: 'novice_awakener',
    name: "Novice Awakener",
    description: "The beginning of the journey.",
    rarity: 'common',
    condition: (p) => true // Always available
  },
  {
    id: 'capable_student',
    name: "Capable Student",
    description: "Reach Rank D (Level 10).",
    rarity: 'common',
    condition: (p) => p.level >= 10
  },
  {
    id: 'elite_scholar',
    name: "Elite Scholar",
    description: "Reach Rank C (Level 20).",
    rarity: 'rare',
    condition: (p) => p.level >= 20
  },
  {
    id: 'dungeon_walker',
    name: "Dungeon Walker",
    description: "Reach Rank B (Level 30).",
    rarity: 'rare',
    condition: (p) => p.level >= 30
  },
  {
    id: 'logic_master',
    name: "Logic Master",
    description: "Reach Rank A (Level 40).",
    rarity: 'epic',
    condition: (p) => p.level >= 40
  },
  {
    id: 'system_admin',
    name: "System Administrator",
    description: "Reach Rank S (Level 50).",
    rarity: 'legendary',
    condition: (p) => p.level >= 50
  },
  {
    id: 'bookworm',
    name: "Bookworm",
    description: "Study for over 60 minutes total.",
    rarity: 'common',
    condition: (p) => p.studyMinutes >= 60
  },
  {
    id: 'marathon_scholar',
    name: "Marathon Scholar",
    description: "Log over 10 hours (600 mins) of study time.",
    rarity: 'epic',
    condition: (p) => p.studyMinutes >= 600
  },
  {
    id: 'disciplined_mind',
    name: "Disciplined Mind",
    description: "Maintain a study streak of 7 days.",
    rarity: 'rare',
    condition: (p) => p.streakDays >= 7
  },
  {
    id: 'boss_slayer',
    name: "Boss Slayer",
    description: "Defeat 5 Dungeon Bosses.",
    rarity: 'rare',
    condition: (p) => p.stats.bossesDefeated >= 5
  },
  {
    id: 'master_tactician',
    name: "Master Tactician",
    description: "Maintain >90% Quiz Accuracy (min 20 questions).",
    rarity: 'epic',
    condition: (p) => {
      if (p.stats.totalQuestionsAnswered < 20) return false;
      return (p.stats.totalQuestionsCorrect / p.stats.totalQuestionsAnswered) >= 0.9;
    }
  },
  {
    id: 'perfectionist',
    name: "The Perfectionist",
    description: "Answer 50 questions with 100% accuracy.",
    rarity: 'legendary',
    condition: (p) => p.stats.totalQuestionsAnswered >= 50 && p.stats.totalQuestionsAnswered === p.stats.totalQuestionsCorrect
  }
];

export const checkForNewTitles = (player: Player): string[] => {
  const newTitles: string[] = [];
  
  AVAILABLE_TITLES.forEach(titleDef => {
    if (!player.unlockedTitles.includes(titleDef.name)) {
      if (titleDef.condition(player)) {
        newTitles.push(titleDef.name);
      }
    }
  });

  return newTitles;
};

// =====================

/**
 * Adds EXP to a player and handles Level Up logic.
 */
export const addExp = (player: Player, amount: number): Player => {
  let currentExp = player.currentExp + amount;
  let currentLevel = player.level;
  let currentMaxExp = player.maxExp;

  while (currentExp >= currentMaxExp) {
    currentExp -= currentMaxExp;
    currentLevel++;
    currentMaxExp = calculateMaxExp(currentLevel);
  }

  const newRank = determineRank(currentLevel);

  return {
    ...player,
    level: currentLevel,
    currentExp: currentExp,
    maxExp: currentMaxExp,
    rank: newRank,
  };
};

export const INITIAL_PLAYER: Player = {
  username: 'Player',
  grade: 'Class 1',
  level: 1,
  currentExp: 0,
  maxExp: calculateMaxExp(1),
  rank: Rank.E,
  title: 'Novice Awakener',
  unlockedTitles: ['Novice Awakener'],
  reports: [],
  stats: {
    totalQuestionsAnswered: 0,
    totalQuestionsCorrect: 0,
    bossesDefeated: 0
  },
  classType: 'Student',
  studyMinutes: 0,
  streakDays: 1,
  dungeonProgress: {},
};

export const MOCK_SUBJECTS: Subject[] = [
  // === PRIMARY (Class 1-5) ===
  { 
    id: 'math-elem', 
    name: 'Number Magic', 
    description: 'The Garden of Arithmetic', 
    icon: 'Calculator', 
    allowedGrades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: Addition & Subtraction', 
        content: 'Addition is the process of bringing two or more numbers (or things) together to make a new total. Subtraction is taking one number away from another.\n\nKey Concepts:\n- Sum: The result of addition.\n- Difference: The result of subtraction.\n- Carrying and Borrowing are essential techniques for larger numbers.',
        summary: '- Addition combines sets.\n- Subtraction removes from a set.\n- Practice carrying for sums > 9.'
      },
      { 
        id: 'c2', 
        title: 'Floor 2: Multiplication Tables', 
        content: 'Multiplication is repeated addition. 3 x 4 means adding 3, four times (3 + 3 + 3 + 3).\n\nMemorizing tables 1-10 is crucial for speed casting mathematical spells.',
        summary: '- Multiplication = Repeated Addition.\n- Memorize tables for speed.'
      },
      { 
        id: 'c3', 
        title: 'Floor 3: Basic Division', 
        content: 'Division is splitting into equal parts or groups. It is the fair share result.',
        summary: '- Division splits numbers into equal groups.\n- Inverse of multiplication.'
      }
    ] 
  },
  { 
    id: 'eng-elem', 
    name: 'Story World', 
    description: 'The Alphabet Forest', 
    icon: 'BookOpen', 
    allowedGrades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: Sentence Structure', 
        content: 'A complete sentence must have a Subject (who/what) and a Predicate (action). \n\nExample: "The cat (Subject) runs fast (Predicate)."',
        summary: '- Every sentence needs a Subject and Action.\n- Start with Capital, end with Punctuation.'
      },
      { 
        id: 'c2', 
        title: 'Floor 2: Vocabulary Expansion', 
        content: 'Adjectives describe nouns (Big dog). Adverbs describe verbs (Runs quickly). Using these makes your stories vivid.',
        summary: '- Adjectives = Describe Things.\n- Adverbs = Describe Actions.'
      }
    ] 
  },
  { 
    id: 'art-elem', 
    name: 'Visual Arts', 
    description: 'Canvas of Imagination', 
    icon: 'Palette', 
    allowedGrades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: Colors & Shapes', content: 'Primary colors (Red, Blue, Yellow) mix to form secondary colors. Shapes build structure.', summary: '- Primary vs Secondary colors.\n- Shapes are foundation.' },
      { id: 'c2', title: 'Floor 2: Perspective', content: 'Perspective gives depth to flat images. Vanishing points create distance.', summary: '- Vanishing points create depth.' }
    ] 
  },

  // === MIDDLE (Class 6-8) ===
  { 
    id: 'sci-mid', 
    name: 'General Science', 
    description: 'Lab of Living Things', 
    icon: 'FlaskConical', 
    allowedGrades: ['Class 6', 'Class 7', 'Class 8'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: Cells & Structures', 
        content: 'Cells are the basic building blocks of all living things. The human body is composed of trillions of cells. \n\nKey Parts:\n- Nucleus: The Brain.\n- Mitochondria: The Powerhouse.\n- Cell Membrane: The Shield.',
        summary: '- Cells are life units.\n- Nucleus controls cell.\n- Mitochondria provides energy.'
      },
      { 
        id: 'c2', 
        title: 'Floor 2: Force & Motion', 
        content: 'Newton\'s Laws govern motion. \n1. Inertia: Objects stay still unless pushed.\n2. F=ma: Force equals mass times acceleration.\n3. Action/Reaction: Every action has an equal opposite reaction.',
        summary: '- Inertia keeps things as they are.\n- Force = Mass x Acceleration.\n- Action = Reaction.'
      },
      { 
        id: 'c3', 
        title: 'Floor 3: Light & Sound', 
        content: 'Light travels in straight lines (rays). Sound travels in waves through a medium (air, water). Light is faster than sound.',
        summary: '- Light = Rays, Fast.\n- Sound = Waves, Needs medium.'
      }
    ] 
  },
  { 
    id: 'hist-mid', 
    name: 'Ancient History', 
    description: 'Archives of Time', 
    icon: 'Scroll', 
    allowedGrades: ['Class 6', 'Class 7', 'Class 8'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: The First Civilizations', 
        content: 'Mesopotamia, located between the Tigris and Euphrates rivers, is known as the Cradle of Civilization. They invented writing (Cuneiform) and the wheel.',
        summary: '- Mesopotamia = Land between rivers.\n- Invented Writing & Wheel.'
      },
      { 
        id: 'c2', 
        title: 'Floor 2: The Pyramids', 
        content: 'The Ancient Egyptians built Pyramids as tombs for Pharaohs. They believed in the afterlife and mummification.',
        summary: '- Pyramids are tombs.\n- Built for Pharaohs.'
      }
    ] 
  },
  { 
    id: 'geo-mid', 
    name: 'Geography', 
    description: 'The World Map', 
    icon: 'Globe', 
    allowedGrades: ['Class 6', 'Class 7', 'Class 8'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: Tectonic Plates', content: 'Earth\'s crust is divided into plates that move. Their collision causes earthquakes and volcanoes.', summary: '- Plates move slowly.\n- Collisions cause quakes.' },
      { id: 'c2', title: 'Floor 2: Climate Zones', content: 'The equator is hot (Tropical), poles are cold (Polar). Weather is short-term, Climate is long-term.', summary: '- Equator = Hot, Poles = Cold.\n- Climate vs Weather.' }
    ] 
  },

  // === HIGH SCHOOL (Class 9-12) ===
  { 
    id: 'math-adv', 
    name: 'Adv. Mathematics', 
    description: 'The Calculus Core', 
    icon: 'Sigma', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: Quadratic Equations', 
        content: 'A quadratic equation involves x squared (x²). The standard form is ax² + bx + c = 0. \n\nSolutions can be found using factoring or the Quadratic Formula.',
        summary: '- Standard Form: ax² + bx + c = 0\n- Use Quadratic Formula to solve.'
      },
      { 
        id: 'c2', 
        title: 'Floor 2: Trigonometry', 
        content: 'Trigonometry deals with triangles. SOH CAH TOA:\n- Sine = Opposite / Hypotenuse\n- Cosine = Adjacent / Hypotenuse\n- Tangent = Opposite / Adjacent',
        summary: '- SOH CAH TOA rules triangles.\n- Sine, Cosine, Tangent.'
      },
      { id: 'c3', title: 'Floor 3: Limits & Continuity', content: 'Limits describe the value a function approaches as the input approaches some value.', summary: '- Limits predict value approach.\n- Foundation of Calculus.' },
      { id: 'c4', title: 'Floor 4: Derivatives', content: 'The derivative measures the instantaneous rate of change (slope) of a function.', summary: '- Derivative = Slope of tangent line.' }
    ] 
  },
  { 
    id: 'phys-adv', 
    name: 'Quantum Physics', 
    description: 'The Laws of Reality', 
    icon: 'Atom', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: Kinematics', 
        content: 'Kinematics describes motion without considering forces. \nKey variables: Displacement (d), Velocity (v), Acceleration (a), Time (t).',
        summary: '- Motion without force.\n- Remember d, v, a, t equations.'
      },
      { id: 'c2', title: 'Floor 2: Thermodynamics', content: 'Energy cannot be created or destroyed, only transferred. Entropy (disorder) always increases.', summary: '- Energy is constant.\n- Entropy increases.' },
      { id: 'c3', title: 'Floor 3: Electromagnetism', content: 'Electric currents produce magnetic fields. Changing magnetic fields produce electric currents.', summary: '- Electricity and Magnetism are linked.' },
      { id: 'c4', title: 'Floor 4: Quantum Mechanics', content: 'At the subatomic level, particles behave like waves. Observation affects reality (Heisenberg Uncertainty Principle).', summary: '- Particles are Waves.\n- Observation changes outcome.' }
    ] 
  },
  { 
    id: 'chem-adv', 
    name: 'Alchemy (Chem)', 
    description: 'Matter Manipulation', 
    icon: 'Beaker', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: Periodic Table', content: 'Elements are arranged by atomic number. Groups (columns) have similar chemical properties.', summary: '- Elements ordered by protons.\n- Columns share traits.' },
      { id: 'c2', title: 'Floor 2: Chemical Bonding', content: 'Ionic bonds transfer electrons. Covalent bonds share electrons.', summary: '- Ionic = Steal Electron.\n- Covalent = Share Electron.' },
      { id: 'c3', title: 'Floor 3: Organic Chemistry', content: 'The study of Carbon compounds. Methane (CH4) is the simplest alkane.', summary: '- Carbon is key.\n- Alkanes, Alkenes, Alkynes.' }
    ] 
  },
  { 
    id: 'bio-adv', 
    name: 'Biology', 
    description: 'The Codex of Life', 
    icon: 'Dna', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: Genetics', content: 'DNA holds instructions. Genes are segments of DNA. Dominant alleles mask Recessive ones.', summary: '- DNA = Code.\n- Dominant > Recessive.' },
      { id: 'c2', title: 'Floor 2: Evolution', content: 'Natural Selection: Traits that help survival are passed on.', summary: '- Survival of the fittest.' },
      { id: 'c3', title: 'Floor 3: Ecology', content: 'Ecosystems rely on producers (plants), consumers (animals), and decomposers.', summary: '- Producers -> Consumers -> Decomposers.' }
    ] 
  },
  { 
    id: 'code-adv', 
    name: 'Arcane Coding', 
    description: 'The Digital Matrix', 
    icon: 'Terminal', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { 
        id: 'c1', 
        title: 'Floor 1: Algorithms', 
        content: 'An algorithm is a step-by-step procedure for calculations. Sorting algorithms (Bubble, Merge, Quick) organize data.',
        summary: '- Algorithms are recipes for data.\n- Sorting organizes info.'
      },
      { id: 'c2', title: 'Floor 2: Data Structures', content: 'Arrays, Linked Lists, Stacks, and Queues store data differently for efficient access.', summary: '- Structures store data efficiently.\n- Stack = LIFO, Queue = FIFO.' },
      { id: 'c3', title: 'Floor 3: Web Development', content: 'HTML structure, CSS style, JS logic. The trifecta of the web.', summary: '- HTML, CSS, JS build the web.' },
      { id: 'c4', title: 'Floor 4: AI & Machine Learning', content: 'Neural Networks mimic the brain to learn patterns from data.', summary: '- AI learns from data patterns.' }
    ] 
  },
  { 
    id: 'astro-adv', 
    name: 'Astronomy', 
    description: 'Star Charting', 
    icon: 'Star', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: The Solar System', content: 'Eight planets orbit Sol. Terrestrial (Rocky) vs Jovian (Gas Giants).', summary: '- Rocky inner planets.\n- Gas outer planets.' },
      { id: 'c2', title: 'Floor 2: Black Holes', content: 'Regions of space where gravity is so strong that nothing, not even light, can escape.', summary: '- Infinite density.\n- No escape.' }
    ] 
  },
  { 
    id: 'econ-adv', 
    name: 'Economics', 
    description: 'Market Forces', 
    icon: 'TrendingUp', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: Supply & Demand', content: 'The price is determined by the intersection of supply and demand curves.', summary: '- Supply up, Price down.\n- Demand up, Price up.' },
      { id: 'c2', title: 'Floor 2: Inflation', content: 'The rate at which the general level of prices for goods and services is rising.', summary: '- Money buys less over time.' }
    ] 
  },
  { 
    id: 'psych-adv', 
    name: 'Psychology', 
    description: 'Mind Palaces', 
    icon: 'BrainCircuit', 
    allowedGrades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], 
    chapters: [
      { id: 'c1', title: 'Floor 1: The Brain', content: 'Frontal Lobe (Decision Making), Temporal Lobe (Memory), Occipital Lobe (Vision).', summary: '- Lobes control functions.' },
      { id: 'c2', title: 'Floor 2: Cognitive Biases', content: 'Systematic patterns of deviation from norm or rationality in judgment (e.g., Confirmation Bias).', summary: '- Brain takes shortcuts.' }
    ] 
  }
];
