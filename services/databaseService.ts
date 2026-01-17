
import { Player, Quest, Rank, LeaderboardEntry, QuestMetric } from '../types';
import { INITIAL_PLAYER, determineRank, addExp } from './gameLogic';
import { generateDailyQuests } from './geminiService';

class DatabaseService {
  private STORAGE_KEY_PLAYER = 'rankup_player';
  private STORAGE_KEY_QUESTS = 'rankup_quests';
  private STORAGE_KEY_LEADERBOARD = 'rankup_leaderboard';
  private STORAGE_KEY_LAST_LOGIN = 'rankup_last_login';

  private listeners: (() => void)[] = [];
  
  // In-memory state
  private player: Player | null = null;
  private quests: Quest[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  private isInitialized = false;

  constructor() {
    // Delay init slightly to ensure window is ready if needed, though constructor runs immediately
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    try {
      // Load Player
      const savedPlayer = localStorage.getItem(this.STORAGE_KEY_PLAYER);
      if (savedPlayer) {
        this.player = JSON.parse(savedPlayer);
        // Migration: Ensure new fields exist for returning players
        if (this.player) {
            if (!this.player.dungeonProgress) this.player.dungeonProgress = {};
            if (!this.player.unlockedTitles) this.player.unlockedTitles = ['Novice Awakener'];
            if (!this.player.stats) this.player.stats = { totalQuestionsAnswered: 0, totalQuestionsCorrect: 0, bossesDefeated: 0 };
            if (!this.player.reports) this.player.reports = [];
        }
      }

      // Load or Generate Leaderboard
      const savedLb = localStorage.getItem(this.STORAGE_KEY_LEADERBOARD);
      if (savedLb) {
        this.leaderboard = JSON.parse(savedLb);
      } else {
        this.leaderboard = this.generateMockLeaderboard();
        this.saveLeaderboard();
      }

      // Load Quests (Handle Date Logic)
      await this.checkDailyReset();
      
      this.isInitialized = true;
      this.notify();

      // Start Real-Time Simulation (Updates every 5 seconds)
      setInterval(() => this.simulateWorldActivity(), 5000);
    } catch (e) {
      console.error("DB Init Failed", e);
    }
  }

  // --- PUBLIC API ---

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    // Call listener immediately if already initialized to sync state
    if (this.isInitialized) listener();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  getPlayer(): Player | null {
    return this.player;
  }

  createPlayer(username: string, grade: string): Player {
    const newPlayer = { ...INITIAL_PLAYER, username, grade };
    this.updatePlayer(newPlayer);
    
    // Add player to leaderboard if not exists
    if (!this.leaderboard.find(e => e.isPlayer)) {
        this.leaderboard.push({
            id: 'player_me',
            name: username,
            level: 1,
            studyMinutes: 0,
            streak: 1,
            rank: Rank.E,
            isPlayer: true,
            style: 'text-cyan-400 border-cyan-500/50 bg-cyan-900/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]'
        });
        this.saveLeaderboard();
    }
    
    return newPlayer;
  }

  updatePlayer(updates: Partial<Player>) {
    if (!this.player && !updates.username) return; // Need a player or creating one
    
    this.player = this.player ? { ...this.player, ...updates } : updates as Player;
    localStorage.setItem(this.STORAGE_KEY_PLAYER, JSON.stringify(this.player));
    
    // Sync with leaderboard
    const idx = this.leaderboard.findIndex(e => e.isPlayer);
    if (idx !== -1 && this.player) {
      this.leaderboard[idx] = {
        ...this.leaderboard[idx],
        name: this.player.username,
        level: this.player.level,
        studyMinutes: this.player.studyMinutes,
        streak: this.player.streakDays,
        rank: this.player.rank
      };
      this.saveLeaderboard();
    }
    
    this.notify();
  }

  getQuests(): Quest[] {
    return this.quests;
  }

  updateQuest(questId: string, updates: Partial<Quest>) {
    this.quests = this.quests.map(q => q.id === questId ? { ...q, ...updates } : q);
    localStorage.setItem(this.STORAGE_KEY_QUESTS, JSON.stringify(this.quests));
    this.notify();
  }

  incrementQuestProgress(metric: QuestMetric, amount: number): boolean {
      let xpGained = 0;
      let questCompleted = false;
      let anyUpdate = false;

      this.quests = this.quests.map(q => {
          if (q.isCompleted) return q;
          
          if (q.metric === metric) {
              const newProgress = Math.min(q.progress + amount, q.maxProgress);
              if (newProgress !== q.progress) {
                  anyUpdate = true;
                  const isComplete = newProgress >= q.maxProgress;
                  
                  if (isComplete) {
                      xpGained += q.rewardExp;
                      questCompleted = true;
                      return { ...q, progress: newProgress, isCompleted: true };
                  }
                  return { ...q, progress: newProgress };
              }
          }
          return q;
      });

      if (anyUpdate) {
          localStorage.setItem(this.STORAGE_KEY_QUESTS, JSON.stringify(this.quests));
          
          if (xpGained > 0 && this.player) {
              const updatedPlayer = addExp(this.player, xpGained);
              this.updatePlayer(updatedPlayer);
          }
          
          this.notify();
      }

      return questCompleted;
  }

  getLeaderboard(type: 'global' | 'class'): LeaderboardEntry[] {
    // Sort by level desc, then minutes desc
    const sorted = [...this.leaderboard].sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.studyMinutes - a.studyMinutes;
    });

    if (type === 'global') {
        return sorted.slice(0, 50); // Top 50 Global
    } else {
        // Return entries relevant to class (random subset + player for mock)
        return sorted.filter(x => x.isPlayer || x.id.includes('peer')).slice(0, 20);
    }
  }

  logout() {
    this.player = null;
    localStorage.removeItem(this.STORAGE_KEY_PLAYER);
    this.notify();
  }

  // --- INTERNAL UTILS ---

  private async checkDailyReset() {
    const lastLoginDate = localStorage.getItem(this.STORAGE_KEY_LAST_LOGIN);
    const today = new Date().toDateString();

    if (lastLoginDate !== today) {
        // Reset Quests
        if (this.player) {
           this.quests = await generateDailyQuests(this.player.rank, this.player.grade, "General");
           localStorage.setItem(this.STORAGE_KEY_QUESTS, JSON.stringify(this.quests));
        }
        localStorage.setItem(this.STORAGE_KEY_LAST_LOGIN, today);
    } else {
        // Load existing
        const q = localStorage.getItem(this.STORAGE_KEY_QUESTS);
        if (q) this.quests = JSON.parse(q);
        else if (this.player) {
            this.quests = await generateDailyQuests(this.player.rank, this.player.grade, "General");
            localStorage.setItem(this.STORAGE_KEY_QUESTS, JSON.stringify(this.quests));
        }
    }
  }

  private generateMockLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [
        { id: 'elite1', name: 'Sung Jin-Woo', level: 100, studyMinutes: 124500, streak: 850, rank: Rank.S, isPlayer: false, style: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10' },
        { id: 'elite2', name: 'Liu Zhigang', level: 98, studyMinutes: 98000, streak: 720, rank: Rank.S, isPlayer: false, style: 'text-gray-300 border-gray-500/30 bg-gray-800/30' },
        { id: 'elite3', name: 'Thomas Andre', level: 96, studyMinutes: 85000, streak: 600, rank: Rank.S, isPlayer: false, style: 'text-amber-700 border-amber-800/30 bg-amber-900/10' },
        { id: 'elite4', name: 'Go Gun-Hee', level: 95, studyMinutes: 82000, streak: 900, rank: Rank.S, isPlayer: false, style: 'text-white border-gray-700 bg-gray-900/30' },
        { id: 'elite5', name: 'Cha Hae-In', level: 92, studyMinutes: 75000, streak: 450, rank: Rank.S, isPlayer: false, style: 'text-white border-gray-700 bg-gray-900/30' },
    ];
    
    // Generate Random Peers
    for(let i=0; i<30; i++) {
        const lvl = Math.floor(Math.random() * 60) + 1;
        entries.push({
            id: `peer${i}`,
            name: `Student_${Math.floor(Math.random()*9000)+1000}`,
            level: lvl,
            studyMinutes: Math.floor(Math.random() * 5000),
            streak: Math.floor(Math.random() * 30),
            rank: determineRank(lvl),
            isPlayer: false,
            style: 'text-gray-400 border-gray-700/30 bg-gray-900/20'
        });
    }
    
    return entries;
  }

  private saveLeaderboard() {
    localStorage.setItem(this.STORAGE_KEY_LEADERBOARD, JSON.stringify(this.leaderboard));
  }

  private simulateWorldActivity() {
    let changed = false;
    
    // Simulate other students studying
    this.leaderboard.forEach(entry => {
        if (entry.isPlayer) return; 
        
        // 30% chance for a bot to gain stats each tick
        if (Math.random() > 0.7) {
            const mins = Math.floor(Math.random() * 5) + 1;
            entry.studyMinutes += mins;
            
            // 5% chance to level up
            if (Math.random() > 0.95 && entry.level < 100) {
                entry.level += 1;
                entry.rank = determineRank(entry.level);
            }
            changed = true;
        }
    });

    if (changed) {
        this.saveLeaderboard();
        this.notify();
    }
  }
}

export const db = new DatabaseService();
