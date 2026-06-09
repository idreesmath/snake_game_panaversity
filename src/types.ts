export type Difficulty = 'easy' | 'medium' | 'hard';

export type BoardType = 
  | 'classic' 
  | 'large' 
  | 'small' 
  | 'maze' 
  | 'circular' 
  | 'random' 
  | 'portal' 
  | 'infinite';

export type SkinType = 'green' | 'blue' | 'purple' | 'rainbow' | 'fire';

export type PowerUpType =
  | 'speed_boost'
  | 'slow_motion'
  | 'double_score'
  | 'shield'
  | 'ghost'
  | 'growth'
  | 'shrink'
  | 'magnet';

export type GameMode = 'single' | 'versus_ai' | 'coop' | 'local_pvp';

export interface Point {
  x: number;
  y: number;
}

export interface Snake {
  id: number;
  name: string;
  body: Point[];
  direction: Point;
  nextDirection: Point;
  score: number;
  skin: SkinType;
  isAlive: boolean;
  isAI: boolean;
  color: string;
  activePowerups: { [key in PowerUpType]?: number }; // duration remaining in milliseconds
  shieldActive: boolean;
  ghostActive: boolean;
  magnetActive: boolean;
}

export interface FoodItem {
  id: string;
  x: number;
  y: number;
  name: string;
  points: number;
  color: string;
  glowColor: string;
  symbol: string;
  isPowerUp: boolean;
  powerUpType?: PowerUpType;
  expiryTime?: number; // timestamp in terms of match countdown or tick
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'block' | 'laser' | 'moving' | 'rotating';
  dx?: number; // For moving barriers
  dy?: number;
  minX?: number; // Movement bounds
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface Portal {
  id: string;
  entry: Point;
  exit: Point;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  progressMax?: number;
  progressCurrent?: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  board: BoardType;
  date: string;
}

export interface GameStats {
  totalGames: number;
  highestScore: number;
  totalFoodCollected: number;
  longestSnakeLength: number;
  timePlayed: number; // in seconds
}
