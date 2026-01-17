
import { GoogleGenAI, Type } from "@google/genai";
import { BossEncounter, QuizQuestion, Quest, Rank, Player, AnalysisResult } from '../types';

// Initialize AI only if key exists to prevent immediate crash on load if env is missing
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_FAST = 'gemini-3-flash-preview';

export const generateDailyQuests = async (rank: Rank, grade: string, interests: string): Promise<Quest[]> => {
  // Return fixed habit-building quests to build routine and strong mind
  const today = new Date().toDateString();
  
  return [
    {
      id: `quest-read-${today}`,
      title: 'Mana Cultivation',
      description: 'Read for 30 minutes to expand your knowledge base.',
      rewardExp: 100,
      isCompleted: false,
      type: 'daily',
      progress: 0,
      maxProgress: 30,
      metric: 'study_minutes'
    },
    {
      id: `quest-math-${today}`,
      title: 'Logic Calibration',
      description: 'Answer 10 Quiz Questions correctly.',
      rewardExp: 150,
      isCompleted: false,
      type: 'daily',
      progress: 0,
      maxProgress: 10,
      metric: 'questions_answered'
    },
    {
      id: `quest-chapter-${today}`,
      title: 'Dungeon Clearance',
      description: 'Complete 1 Chapter (Floor) in any subject dungeon.',
      rewardExp: 200,
      isCompleted: false,
      type: 'daily',
      progress: 0,
      maxProgress: 1,
      metric: 'chapter_complete'
    },
    {
      id: `quest-boss-${today}`,
      title: 'Boss Slayer',
      description: 'Defeat a Boss (Quiz).',
      rewardExp: 300,
      isCompleted: false,
      type: 'daily',
      progress: 0,
      maxProgress: 1,
      metric: 'boss_defeat'
    }
  ];
};

export const generateBossQuiz = async (subject: string, topic: string, difficulty: Rank): Promise<BossEncounter> => {
  if (!ai) return getFallbackBoss();

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Generate a boss battle quiz for Subject: ${subject}, Topic: ${topic}. Difficulty Rank: ${difficulty}.
      The 'name' should be a monster name related to the topic (e.g. "The Algebra Golem").
      Provide 5 multiple choice questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            health: { type: Type.NUMBER },
            maxHealth: { type: Type.NUMBER },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as BossEncounter;
  } catch (e) {
    console.error("Quiz gen failed, using fallback", e);
    return getFallbackBoss();
  }
};

export const chatWithSystem = async (history: {role: string, parts: {text: string}[]}[], message: string, player: Player): Promise<string> => {
  if (!ai) return "System Offline. Unable to process query.";

  try {
    const systemPrompt = `You are "The System", a gamified educational interface similar to Solo Leveling. 
    You are talking to a student named ${player.username} (Rank: ${player.rank}, Grade: ${player.grade}, Level: ${player.level}).
    
    Current Stats:
    - Study Time: ${player.studyMinutes} mins
    - Streak: ${player.streakDays} days
    - EXP: ${player.currentExp}/${player.maxExp}

    Your personality is stoic, cool, slightly robotic but encouraging. You refer to the user as "Player" or by their name.
    Your goal is to provide specific study advice, answer questions about subjects, or explain game mechanics.
    Keep answers concise (under 100 words) unless asked for a detailed explanation.
    `;

    const chat = ai.chats.create({
      model: MODEL_FAST,
      config: {
        systemInstruction: systemPrompt,
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Command not recognized.";
  } catch (e) {
    console.error("Chat failed", e);
    return "Error processing voice command.";
  }
};

export const generateStudentAnalysis = async (player: Player): Promise<AnalysisResult> => {
  if (!ai) return {
    condition: "System Offline. Analysis unavailable.",
    focus: "General Studies",
    protocol: "Maintain current study streak manually."
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Generate a personalized system analysis for a student.
      Profile: ${player.username}, Grade: ${player.grade}, Rank: ${player.rank}, Level: ${player.level}.
      Study Time: ${player.studyMinutes} mins. Streak: ${player.streakDays} days.
      
      Return JSON with:
      - condition: A brief, sci-fi style assessment of their current growth status.
      - focus: A specific subject or topic recommendation based on their grade.
      - protocol: A specific, actionable study habit or tip to improve efficiency.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            focus: { type: Type.STRING },
            protocol: { type: Type.STRING }
          }
        }
      }
    });
    
    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (e) {
    console.error("Analysis failed", e);
    return {
      condition: "Connection to Mainframe Unstable.",
      focus: "Review Previous Materials",
      protocol: "Re-establish consistent study routine."
    };
  }
};

const getFallbackBoss = (): BossEncounter => ({
  name: "Glitch in the System",
  health: 100,
  maxHealth: 100,
  questions: [
    {
      id: 'err1',
      question: "The system failed to generate a boss. What do you do?",
      options: ["Panic", "Retry", "Debug", "Sleep"],
      correctIndex: 1,
      explanation: "Always retry the connection."
    }
  ]
});

// Deprecated: Replaced by generateStudentAnalysis
export const generateGuidance = async (player: Player): Promise<string> => {
  return "System Updated. Access the new Recommendation Panel.";
};
