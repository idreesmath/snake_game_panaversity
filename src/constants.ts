import { Difficulty, BoardType, SkinType, PowerUpType, Achievement, LeaderboardEntry } from './types';

export const GRID_CELL_SIZE = 20; // in px for rendering if needed

export const SPEEDS = {
  easy: 155,
  medium: 110,
  hard: 70,
};

export const MULTIPLIERS = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.22,
};

export interface FruitConfig {
  name: string;
  points: number;
  color: string;
  glowColor: string;
  symbol: string;
}

export const FRUIT_PACK: FruitConfig[] = [
  { name: 'Apple', points: 10, color: '#ff2255', glowColor: 'rgba(255, 34, 85, 0.8)', symbol: '🍎' },
  { name: 'Banana', points: 15, color: '#ffee11', glowColor: 'rgba(255, 238, 17, 0.8)', symbol: '🍌' },
  { name: 'Mango', points: 20, color: '#ffaa00', glowColor: 'rgba(255, 170, 0, 0.8)', symbol: '🥭' },
  { name: 'Orange', points: 15, color: '#ff6600', glowColor: 'rgba(255, 102, 0, 0.8)', symbol: '🍊' },
  { name: 'Strawberry', points: 25, color: '#ff33aa', glowColor: 'rgba(255, 51, 170, 0.8)', symbol: '🍓' },
  { name: 'Watermelon', points: 30, color: '#22ff66', glowColor: 'rgba(34, 255, 102, 0.8)', symbol: '🍉' },
  { name: 'Cherry', points: 20, color: '#ff0033', glowColor: 'rgba(255, 0, 51, 0.8)', symbol: '🍒' },
  { name: 'Grapes', points: 25, color: '#aa33ff', glowColor: 'rgba(170, 51, 255, 0.8)', symbol: '🍇' },
  { name: 'Pineapple', points: 30, color: '#ddff22', glowColor: 'rgba(221, 255, 34, 0.8)', symbol: '🍍' },
];

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  symbol: string;
  color: string;
  glowColor: string;
  description: string;
  durationMs: number;
}

export const POWER_UP_PACK: PowerUpConfig[] = [
  {
    type: 'speed_boost',
    name: 'Speed Boost Star',
    symbol: '⭐',
    color: '#ffdd00',
    glowColor: 'rgba(255, 221, 0, 0.9)',
    description: 'Increases snake speed temporarily. Fast reflexes needed!',
    durationMs: 7000,
  },
  {
    type: 'slow_motion',
    name: 'Slow Motion Crystal',
    symbol: '❄️',
    color: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.9)',
    description: 'Reduces snake speed temporarily. Easier navigation.',
    durationMs: 7000,
  },
  {
    type: 'double_score',
    name: 'Double Score Gem',
    symbol: '💎',
    color: '#d500f9',
    glowColor: 'rgba(213, 0, 249, 0.9)',
    description: 'Doubles all score gains for 10 seconds.',
    durationMs: 10000,
  },
  {
    type: 'shield',
    name: 'Shield Orb',
    symbol: '🛡️',
    color: '#2979ff',
    glowColor: 'rgba(41, 121, 255, 0.9)',
    description: 'Protects from one crash collision with walls/blocks/self.',
    durationMs: 15000,
  },
  {
    type: 'ghost',
    name: 'Ghost Orb',
    symbol: '👻',
    color: '#f50057',
    glowColor: 'rgba(245, 0, 87, 0.9)',
    description: 'Allows passing through external walls safely!',
    durationMs: 10000,
  },
  {
    type: 'growth',
    name: 'Growth Capsule',
    symbol: '💊',
    color: '#00e676',
    glowColor: 'rgba(0, 230, 118, 0.9)',
    description: 'Adds extra score and segments instantly.',
    durationMs: 0, // Instant
  },
  {
    type: 'shrink',
    name: 'Shrink Capsule',
    symbol: '🧪',
    color: '#ff1744',
    glowColor: 'rgba(255, 23, 68, 0.9)',
    description: 'Shrinks some snake segments, giving you breathing room!',
    durationMs: 0, // Instant
  },
  {
    type: 'magnet',
    name: 'Magnet Orb',
    symbol: '🧲',
    color: '#ff9100',
    glowColor: 'rgba(255, 145, 0, 0.9)',
    description: 'Pulls nearby food straight towards your head!',
    durationMs: 8000,
  },
];

export const SKINS = [
  { type: 'green' as SkinType, name: 'Green Neon', color: '#10b981', glow: 'rgba(16, 185, 129, 0.8)', tailColors: ['#10b981', '#047857'] },
  { type: 'blue' as SkinType, name: 'Blue Neon', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.8)', tailColors: ['#3b82f6', '#1d4ed8'] },
  { type: 'purple' as SkinType, name: 'Purple Neon', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.8)', tailColors: ['#8b5cf6', '#6d28d9'] },
  { type: 'rainbow' as SkinType, name: 'Rainbow Neon', color: '#ff007f', glow: 'rgba(255, 0, 127, 0.8)', tailColors: ['#ff003c', '#ff8400', '#ffee00', '#00ff3c', '#00f6ff', '#8d00ff'] },
  { type: 'fire' as SkinType, name: 'Fire Neon', color: '#f97316', glow: 'rgba(249, 115, 22, 0.8)', tailColors: ['#ef4444', '#f97316', '#eab308'] },
];

export interface BoardConfig {
  type: BoardType;
  name: string;
  description: string;
  width: number;
  height: number;
  hasOuterWalls: boolean;
  baseObstaclesCount: number;
}

export const BOARDS: BoardConfig[] = [
  {
    type: 'classic',
    name: 'Classic Square',
    description: 'Standard 20x20 grid with open wrap-around borders.',
    width: 20,
    height: 20,
    hasOuterWalls: false,
    baseObstaclesCount: 0,
  },
  {
    type: 'large',
    name: 'Large Arena',
    description: 'Spacious 30x30 neon playground with open wrap-around borders.',
    width: 30,
    height: 30,
    hasOuterWalls: false,
    baseObstaclesCount: 0,
  },
  {
    type: 'small',
    name: 'Small Challenge',
    description: 'Tight 14x14 wrap-around grid for fast, high-focus action.',
    width: 14,
    height: 14,
    hasOuterWalls: false,
    baseObstaclesCount: 0,
  },
  {
    type: 'maze',
    name: 'Maze Board',
    description: 'Includes central structural layout walls. Outer border wraps.',
    width: 20,
    height: 20,
    hasOuterWalls: false,
    baseObstaclesCount: 0,  // custom defined coordinates
  },
  {
    type: 'circular',
    name: 'Circular Arena',
    description: 'Sleek rounded barrier board with wrap-around boundaries.',
    width: 22,
    height: 22,
    hasOuterWalls: false, // Custom rounded logic
    baseObstaclesCount: 0,
  },
  {
    type: 'random',
    name: 'Random Board',
    description: 'Glowing dynamic barriers on an open wrap-around grid.',
    width: 20,
    height: 20,
    hasOuterWalls: false,
    baseObstaclesCount: 8,
  },
  {
    type: 'portal',
    name: 'Portal Board',
    description: 'Teleportation nodes connect grid points with open borders.',
    width: 20,
    height: 20,
    hasOuterWalls: false,
    baseObstaclesCount: 0,
  },
  {
    type: 'infinite',
    name: 'Infinite Wrap',
    description: 'Wrap-around board with zero outer borders. Safe zones.',
    width: 20,
    height: 20,
    hasOuterWalls: false,
    baseObstaclesCount: 0,
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_bite',
    title: 'First Bite',
    description: 'Eat your first tasty neon fruit!',
    unlocked: false,
    icon: '🍎',
  },
  {
    id: 'fruit_collector',
    title: 'Fruit Collector',
    description: 'Collect a total of 100 food items.',
    unlocked: false,
    icon: '🍇',
    progressMax: 100,
    progressCurrent: 0,
  },
  {
    id: 'speed_master',
    title: 'Speed Master',
    description: 'Reach a score of over 150 on Hard difficulty!',
    unlocked: false,
    icon: '⚡',
  },
  {
    id: 'shield_survival',
    title: 'Collision Deflector',
    description: 'Survive a crash using the active Shield Orb power-up.',
    unlocked: false,
    icon: '🛡️',
  },
  {
    id: 'snake_king',
    title: 'Snake Overlord',
    description: 'Reach a snake length of 25 segments.',
    unlocked: false,
    icon: '👑',
    progressMax: 25,
    progressCurrent: 3,
  },
  {
    id: 'century',
    title: 'Neon Millennial',
    description: 'Score 500 or more points in a single match.',
    unlocked: false,
    icon: '💎',
  },
];
