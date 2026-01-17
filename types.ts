
export enum Rank {
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  SS = 'SS', // National Level
  SSS = 'SSS' // Monarch Level
}

export interface ChapterProgress {
  notesRead: boolean;
  summaryRead: boolean;
  bossDefeated: boolean;
}

export interface PlayerStats {
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  bossesDefeated: number;
}

export interface DailyReport {
  id: string;
  timestamp: string; // ISO Date string
  content: string;
  mood: 'productive' | 'neutral' | 'struggling';
}

export interface Player {
  username: string;
  grade: string; // e.g., "Class 2", "Class 10"
  level: number;
  currentExp: number;
  maxExp: number;
  rank: Rank;
  title: string;
  unlockedTitles: string[];
  reports: DailyReport[];
  stats: PlayerStats;
  classType: string; // e.g., "Scholar", "Mage", "Knight"
  studyMinutes: number;
  streakDays: number;
  dungeonProgress: Record<string, ChapterProgress>; // Key: "subjectId_chapterId"
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  studyMinutes: number;
  streak: number;
  rank: Rank;
  isPlayer: boolean;
  style?: string; // CSS classes for styling
}

export type QuestMetric = 'study_minutes' | 'questions_answered' | 'chapter_complete' | 'boss_defeat';

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardExp: number;
  isCompleted: boolean;
  type: 'daily' | 'story';
  progress: number;
  maxProgress: number;
  metric: QuestMetric;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  allowedGrades: string[]; // List of grades that can access this subject
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // Detailed Notes
  summary: string; // Quick Summary
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BossEncounter {
  name: string;
  health: number;
  maxHealth: number;
  questions: QuizQuestion[];
}

export interface AnalysisResult {
  condition: string;
  focus: string;
  protocol: string;
}

export interface TitleDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (player: Player) => boolean;
}
