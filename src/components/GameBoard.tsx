import React, { useRef, useEffect, useState } from 'react';
import { 
  Pause, RotateCcw, Volume2, VolumeX, ShieldAlert, Zap, 
  HelpCircle, Sparkles, AlertTriangle, Play, Home 
} from 'lucide-react';
import { Point, Difficulty, BoardType, SkinType, GameMode, Snake, FoodItem, Obstacle, Portal, LeaderboardEntry, GameStats, PowerUpType } from '../types';
import { SPEEDS, MULTIPLIERS, FRUIT_PACK, POWER_UP_PACK, SKINS, BOARDS } from '../constants';
import { audio } from '../utils/audio';

interface GameBoardProps {
  difficulty: Difficulty;
  boardType: BoardType;
  skin: SkinType;
  gameMode: GameMode;
  onGameOver: (p1Score: number, p2Score: number) => void;
  onExit: () => void;
  savedGameState?: any;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingIndicator {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export default function GameBoard({
  difficulty,
  boardType,
  skin,
  gameMode,
  onGameOver,
  onExit,
  savedGameState,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game Config
  const boardConfig = BOARDS.find(b => b.type === boardType) || BOARDS[0];
  const gridWidth = boardConfig.width;
  const gridHeight = boardConfig.height;

  // Sound States inside Board
  const [isMuted, setIsMuted] = useState(audio.getMuteState());

  // Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsSurvived, setSecondsSurvived] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [streakCount, setStreakCount] = useState(0);
  const [comboTimer, setComboTimer] = useState(0); // countdown

  // Active Snakes
  const [snakes, setSnakes] = useState<Snake[]>([]);
  // Food items and powerups currently on board
  const [foods, setFoods] = useState<FoodItem[]>([]);
  // Moving & static barriers
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  // Teleport gates
  const [portals, setPortals] = useState<Portal[]>([]);

  // Sidebar highscore and leaderboard references
  const [highScore, setHighScore] = useState(0);
  const [sidebarLeaderboard, setSidebarLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    try {
      const storedStats = localStorage.getItem('neon_snake_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        if (parsed && typeof parsed.highestScore === 'number') {
          setHighScore(parsed.highestScore);
        }
      }
    } catch (e) {
      console.warn('Failed loading scoreboard stats for sidebar', e);
    }

    try {
      const storedLeaderboard = localStorage.getItem('neon_snake_leaderboard');
      if (storedLeaderboard) {
        setSidebarLeaderboard(JSON.parse(storedLeaderboard));
      }
    } catch (e) {
      console.warn('Failed loading leaderboard list for sidebar', e);
    }
  }, []);

  // Canvas visual states (separate from grid ticks to run at 60 FPS)
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingIndicator[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keyboard navigation & tick control
  const lastTickTime = useRef<number>(0);
  const gameStepSpeed = useRef<number>(SPEEDS[difficulty]);

  // Track eyes blinking frame counters
  const blinkTimerRef = useRef<{ [snakeId: number]: number }>({});

  // Keyboard Directions references to avoid state race conditions inside tick timer
  const snakesDirectionsRef = useRef<{ [snakeId: number]: { dir: Point; nextDir: Point } }>({});

  const isCoop = gameMode === 'coop';
  const isPvP = gameMode === 'local_pvp';
  const isAIOpponent = gameMode === 'versus_ai';

  // 1. Initialise Portals, Obstacles, and Snake on launch
  useEffect(() => {
    // Generate specialized obstacles based on Board
    let initialObstacles: Obstacle[] = [];
    if (boardType === 'maze') {
      // Draw customized wall lines
      const mazeBlocks: Point[] = [
        // Center cross
        { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
        { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 },
        { x: 5, y: 14 }, { x: 6, y: 14 }, { x: 7, y: 14 },
        { x: 12, y: 14 }, { x: 13, y: 14 }, { x: 14, y: 14 },
        { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 9, y: 10 }, { x: 10, y: 10 }
      ];
      initialObstacles = mazeBlocks.map((pt, id) => ({
        id: `maze-block-${id}`,
        x: pt.x,
        y: pt.y,
        type: 'block'
      }));
    } else if (boardType === 'random') {
      const reservedCells = new Set<string>([
        // Spawning zones
        '2,10', '3,10', '4,10', '5,10', '6,10', '15,10', '16,10'
      ]);
      const randomCount = boardConfig.baseObstaclesCount + (difficulty === 'hard' ? 4 : 0);
      for (let i = 0; i < randomCount; i++) {
        let x = Math.floor(Math.random() * (gridWidth - 4)) + 2;
        let y = Math.floor(Math.random() * (gridHeight - 4)) + 2;
        if (!reservedCells.has(`${x},${y}`)) {
          initialObstacles.push({
            id: `rand-obst-${i}`,
            x,
            y,
            type: Math.random() > 0.6 ? 'moving' : 'block',
            dx: Math.random() > 0.5 ? 1 : -1,
            dy: 0,
            minX: 2,
            maxX: gridWidth - 3,
          });
          reservedCells.add(`${x},${y}`);
        }
      }
    } else if (boardType === 'custom' as any) {
      // Load custom defined obstacles
      try {
        const stored = localStorage.getItem('neon_snake_custom_obstacles');
        if (stored) {
          const customPts = JSON.parse(stored) as Point[];
          initialObstacles = customPts.map((pt, id) => ({
            id: `custom-block-${id}`,
            x: pt.x,
            y: pt.y,
            type: 'block'
          }));
        }
      } catch (err) {
        console.error('Failed to load custom board', err);
      }
    }

    setObstacles(initialObstacles);

    // Initialise portals for portal board
    let initialPortals: Portal[] = [];
    if (boardType === 'portal') {
      initialPortals = [
        { id: 'p1', entry: { x: 2, y: 2 }, exit: { x: gridWidth - 3, y: gridHeight - 3 }, color: '#00e5ff' },
        { id: 'p2', entry: { x: gridWidth - 3, y: gridHeight - 3 }, exit: { x: 2, y: 2 }, color: '#00e5ff' },
        { id: 'p3', entry: { x: gridWidth - 3, y: 2 }, exit: { x: 2, y: gridHeight - 3 }, color: '#d500f9' },
        { id: 'p4', entry: { x: 2, y: gridHeight - 3 }, exit: { x: gridWidth - 3, y: 2 }, color: '#d500f9' },
      ];
    }
    setPortals(initialPortals);

    // Initialise Snakes
    let snakesInitial: Snake[] = [];
    if (savedGameState) {
      // Resume from previous state
      snakesInitial = savedGameState.snakes;
      setFoods(savedGameState.foods);
      setSecondsSurvived(savedGameState.secondsSurvived);
      setComboMultiplier(savedGameState.comboMultiplier);
    } else {
      // Fresh Game
      const middleY = Math.floor(gridHeight / 2);
      // Snake 1: Left spawning
      snakesInitial.push({
        id: 1,
        name: isPvP || isCoop ? 'NEON-S1' : 'P1-CORE',
        body: [
          { x: 5, y: middleY },
          { x: 4, y: middleY },
          { x: 3, y: middleY },
        ],
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        score: 0,
        skin: skin,
        isAlive: true,
        isAI: false,
        color: SKINS.find(s => s.type === skin)?.color || '#10b981',
        activePowerups: {},
        shieldActive: false,
        ghostActive: false,
        magnetActive: false,
      });

      // Player 2 / AI opponent
      if (isCoop || isPvP || isAIOpponent) {
        const altSkin = skin === 'blue' ? 'purple' : 'blue';
        const p2Name = isAIOpponent ? 'CYBER-BOT' : 'NEON-S2';
        const otherY = middleY - 3 > 1 ? middleY - 3 : middleY + 3;

        snakesInitial.push({
          id: 2,
          name: p2Name,
          body: [
            { x: gridWidth - 6, y: otherY },
            { x: gridWidth - 5, y: otherY },
            { x: gridWidth - 4, y: otherY },
          ],
          direction: { x: -1, y: 0 },
          nextDirection: { x: -1, y: 0 },
          score: 0,
          skin: altSkin,
          isAlive: true,
          isAI: isAIOpponent,
          color: SKINS.find(s => s.type === altSkin)?.color || '#3b82f6',
          activePowerups: {},
          shieldActive: false,
          ghostActive: false,
          magnetActive: false,
        });
      }

      setSnakes(snakesInitial);
    }

    // Set directions ref lookup
    snakesInitial.forEach(s => {
      snakesDirectionsRef.current[s.id] = { dir: s.direction, nextDir: s.nextDirection };
      blinkTimerRef.current[s.id] = 0;
    });

    // Spawn Initial Foods
    if (!savedGameState) {
      const initialFoodCount = boardType === 'large' ? 4 : 2;
      const initialFoods: FoodItem[] = [];
      const occupied = new Set<string>();

      // Lock positions already occupied
      snakesInitial.forEach(snk => snk.body.forEach(b => occupied.add(`${b.x},${b.y}`)));
      initialObstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));

      for (let i = 0; i < initialFoodCount; i++) {
        const f = getRandomFreeFood(occupied, initialObstacles, initialFoods, gridWidth, gridHeight, boardType);
        if (f) initialFoods.push(f);
      }
      setFoods(initialFoods);
    }

    setIsPlaying(true);
    audio.startMusic();

    return () => {
      audio.stopMusic();
    };
  }, [gameMode, boardType, skin, difficulty]);

  // 2. Continuous 1-second survival timer & Combo decrements
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const interval = setInterval(() => {
      setSecondsSurvived(prev => prev + 1);
      
      // Decay combo timer
      setComboTimer(prev => {
        if (prev <= 1) {
          setComboMultiplier(1);
          setStreakCount(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // Handle keys listener setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      const key = e.key.toLowerCase();

      // Mute hotkey
      if (key === 'm') {
        e.preventDefault();
        const isMutedNow = audio.toggleMute();
        setIsMuted(isMutedNow);
        return;
      }

      // Resume/Pause toggle Spacebar
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        audio.playClick();
        setIsPaused(prev => !prev);
        return;
      }

      // Restart R
      if (key === 'r') {
        e.preventDefault();
        audio.playLevelUp();
        restartGame();
        return;
      }

      // Exit game: Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        saveAndExit();
        return;
      }

      if (isPaused) return;

      // Player 1 controls (Arrow keys)
      const p1Directions = snakesDirectionsRef.current[1];
      if (p1Directions) {
        if (e.key === 'ArrowUp' && p1Directions.dir.y === 0) {
          e.preventDefault();
          p1Directions.nextDir = { x: 0, y: -1 };
        } else if (e.key === 'ArrowDown' && p1Directions.dir.y === 0) {
          e.preventDefault();
          p1Directions.nextDir = { x: 0, y: 1 };
        } else if (e.key === 'ArrowLeft' && p1Directions.dir.x === 0) {
          e.preventDefault();
          p1Directions.nextDir = { x: -1, y: 0 };
        } else if (e.key === 'ArrowRight' && p1Directions.dir.x === 0) {
          e.preventDefault();
          p1Directions.nextDir = { x: 1, y: 0 };
        }
      }

      // Player 2 controls (WASD keys for coop or pvp)
      const p2Directions = snakesDirectionsRef.current[2];
      if (p2Directions && (isCoop || isPvP)) {
        if (key === 'w' && p2Directions.dir.y === 0) {
          p2Directions.nextDir = { x: 0, y: -1 };
        } else if (key === 's' && p2Directions.dir.y === 0) {
          p2Directions.nextDir = { x: 0, y: 1 };
        } else if (key === 'a' && p2Directions.dir.x === 0) {
          p2Directions.nextDir = { x: -1, y: 0 };
        } else if (key === 'd' && p2Directions.dir.x === 0) {
          p2Directions.nextDir = { x: 1, y: 0 };
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, snakes, isCoop, isPvP]);

  // Touch controls swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isPaused || !isPlaying) return;
    
    // Use first snake as touch steering target
    const p1Directions = snakesDirectionsRef.current[1];
    if (!p1Directions) return;

    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0 && p1Directions.dir.x === 0) {
          p1Directions.nextDir = { x: 1, y: 0 };
        } else if (dx < 0 && p1Directions.dir.x === 0) {
          p1Directions.nextDir = { x: -1, y: 0 };
        }
      } else {
        // Vertical swipe
        if (dy > 0 && p1Directions.dir.y === 0) {
          p1Directions.nextDir = { x: 0, y: 1 };
        } else if (dy < 0 && p1Directions.dir.y === 0) {
          p1Directions.nextDir = { x: 0, y: -1 };
        }
      }
      // reset touch target to avoid sliding repeated trigger
      touchStartRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleVirtualDpadPress = (dir: 'up' | 'down' | 'left' | 'right') => {
    const p1Directions = snakesDirectionsRef.current[1];
    if (!p1Directions || isPaused) return;

    if (dir === 'up' && p1Directions.dir.y === 0) p1Directions.nextDir = { x: 0, y: -1 };
    else if (dir === 'down' && p1Directions.dir.y === 0) p1Directions.nextDir = { x: 0, y: 1 };
    else if (dir === 'left' && p1Directions.dir.x === 0) p1Directions.nextDir = { x: -1, y: 0 };
    else if (dir === 'right' && p1Directions.dir.x === 0) p1Directions.nextDir = { x: 1, y: 0 };

    audio.playClick();
  };

  // Automated AI Pathfinder calculations
  const calculateAIDirection = (aiSnake: Snake, allFoods: FoodItem[]): Point => {
    if (allFoods.length === 0) return aiSnake.direction;

    const head = aiSnake.body[0];
    const occupied = new Set<string>();

    // Mark entire occupied zones
    snakes.forEach(s => s.body.forEach(b => occupied.add(`${b.x},${b.y}`)));
    obstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));

    // Find closest food item
    let nearestFood = allFoods[0];
    let minDist = Infinity;
    allFoods.forEach(food => {
      const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
      if (dist < minDist) {
        minDist = dist;
        nearestFood = food;
      }
    });

    const possibleDirs = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 },  // Right
    ];

    // Filter out directions that immediately cause death
    const safeDirs = possibleDirs.filter(d => {
      // Avoid immediate 180 flip
      if (d.x === -aiSnake.direction.x && d.y === -aiSnake.direction.y) return false;

      // Predict next cell location
      let nx = head.x + d.x;
      let ny = head.y + d.y;

      // Handle wrapping or outer wall boundaries (Wrapping always enabled)
      nx = (nx + gridWidth) % gridWidth;
      ny = (ny + gridHeight) % gridHeight;

      // Avoid obstacles & snake bodies
      if (occupied.has(`${nx},${ny}`)) return false;

      // Under circular boundaries, wrap to opposite side instead of dying
      if (boardType === 'circular') {
        const cx = gridWidth / 2;
        const cy = gridHeight / 2;
        const dist = Math.sqrt(Math.pow(nx - cx, 2) + Math.pow(ny - cy, 2));
        if (dist >= gridWidth / 2) {
          const dx = nx - cx;
          const dy = ny - cy;
          nx = Math.round(cx - dx);
          ny = Math.round(cy - dy);
          nx = (nx + gridWidth) % gridWidth;
          ny = (ny + gridHeight) % gridHeight;
        }
      }

      return true;
    });

    if (safeDirs.length === 0) {
      // AI is trapped! Go straight anyway
      return aiSnake.direction;
    }

    // Among safe directions, pick the one that minimizes Manhattan distance to closest food
    let bestDir = safeDirs[0];
    let bestDist = Infinity;

    safeDirs.forEach(d => {
      let nx = head.x + d.x;
      let ny = head.y + d.y;
      
      // Wrap coordinates
      nx = (nx + gridWidth) % gridWidth;
      ny = (ny + gridHeight) % gridHeight;

      const dist = Math.abs(nx - nearestFood.x) + Math.abs(ny - nearestFood.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    });

    return bestDir;
  };

  // Helper inside tick to spawn new foods safely
  const getRandomFreeFood = (
    occupied: Set<string>,
    tempObstacles: Obstacle[],
    currentFoods: FoodItem[],
    w: number,
    h: number,
    type: BoardType
  ): FoodItem | null => {
    let attempts = 0;
    while (attempts < 150) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      const cellKey = `${x},${y}`;

      // Ensure not occupied by snake/obst/food
      const isOccupiedBySnake = occupied.has(cellKey);
      const isOccupiedByObstacle = tempObstacles.some(ob => ob.x === x && ob.y === y);
      const isOccupiedByPortal = portals.some(p => (p.entry.x === x && p.entry.y === y) || (p.exit.x === x && p.exit.y === y));
      const isOccupiedByFood = currentFoods.some(f => f.x === x && f.y === y);

      // Verify circular board bounds
      let inCircularBounds = true;
      if (type === 'circular') {
        const cx = w / 2;
        const cy = h / 2;
        const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        if (dist >= w / 2 - 1) inCircularBounds = false;
      }

      if (!isOccupiedBySnake && !isOccupiedByObstacle && !isOccupiedByPortal && !isOccupiedByFood && inCircularBounds) {
        // Roll for powerup spawn with 15% probability
        const isPowerUp = Math.random() < 0.16;

        if (isPowerUp) {
          const powerConfig = POWER_UP_PACK[Math.floor(Math.random() * POWER_UP_PACK.length)];
          return {
            id: `food-${Math.random()}`,
            x,
            y,
            name: powerConfig.name,
            points: 40,
            color: powerConfig.color,
            glowColor: powerConfig.glowColor,
            symbol: powerConfig.symbol,
            isPowerUp: true,
            powerUpType: powerConfig.type,
          };
        } else {
          // Standard Edible Fruit
          const fruitConfig = FRUIT_PACK[Math.floor(Math.random() * FRUIT_PACK.length)];
          return {
            id: `food-${Math.random()}`,
            x,
            y,
            name: fruitConfig.name,
            points: fruitConfig.points,
            color: fruitConfig.color,
            glowColor: fruitConfig.glowColor,
            symbol: fruitConfig.symbol,
            isPowerUp: false,
          };
        }
      }
      attempts++;
    }
    return null;
  };

  // Core Simulation Ticking Engine
  const runGameStep = () => {
    if (isPaused || !isPlaying) return;

    // Check if any snake left isAlive
    const aliveSnakes = snakes.filter(s => s.isAlive);
    if (aliveSnakes.length === 0) {
      endTheSession();
      return;
    }

    // 1. Move barriers/obstacles (Random Board moving obstacles)
    let nextObstacles = obstacles.map(ob => {
      if (ob.type === 'moving' && ob.dx !== undefined) {
        let nx = ob.x + ob.dx;
        let ndx = ob.dx;
        if (ob.minX !== undefined && nx < ob.minX) {
          nx = ob.minX;
          ndx = -ob.dx;
        } else if (ob.maxX !== undefined && nx > ob.maxX) {
          nx = ob.maxX;
          ndx = -ob.dx;
        }
        return { ...ob, x: nx, dx: ndx };
      }
      return ob;
    });
    setObstacles(nextObstacles);

    // Track state of snakes to updates
    const nextSnakes = snakes.map(currentSnake => {
      if (!currentSnake.isAlive) return currentSnake;

      const snakeId = currentSnake.id;

      // Update directions
      let snakeDirs = snakesDirectionsRef.current[snakeId];
      if (currentSnake.isAI) {
        const aiDir = calculateAIDirection(currentSnake, foods);
        snakeDirs = { dir: aiDir, nextDir: aiDir };
        snakesDirectionsRef.current[snakeId] = snakeDirs;
      }

      if (!snakeDirs) return currentSnake;

      // Freeze direction
      const currentDir = snakeDirs.nextDir;
      snakeDirs.dir = currentDir;

      // Get next head coordinates
      const head = currentSnake.body[0];
      let nextHead = {
        x: head.x + currentDir.x,
        y: head.y + currentDir.y,
      };

      // Handle Portals Teleport Gates
      const hitPortal = portals.find(p => p.entry.x === nextHead.x && p.entry.y === nextHead.y);
      if (hitPortal) {
        nextHead = { x: hitPortal.exit.x, y: hitPortal.exit.y };
        audio.playClick();
        triggerBurst(nextHead.x, nextHead.y, '#d500f9', 15);
        triggerFloater(nextHead.x, nextHead.y, 'WARPED', '#d500f9');
      }

      // Always allow crossing the walls of the board!
      nextHead.x = (nextHead.x + gridWidth) % gridWidth;
      nextHead.y = (nextHead.y + gridHeight) % gridHeight;

      // Check Obstacle Collisions
      const hitObstacle = nextObstacles.some(ob => ob.x === nextHead.x && ob.y === nextHead.y);
      if (hitObstacle) {
        const shieldActive = currentSnake.activePowerups['shield'] !== undefined;
        if (shieldActive) {
          audio.playCollision();
          triggerBurst(nextHead.x, nextHead.y, '#2979ff', 20);
          triggerFloater(nextHead.x, nextHead.y, 'CORE DOCKED', '#2979ff');
          const nextPowerUps = { ...currentSnake.activePowerups };
          delete nextPowerUps['shield'];
          return {
            ...currentSnake,
            activePowerups: nextPowerUps,
          };
        } else {
          audio.playGameOver();
          triggerBurst(nextHead.x, nextHead.y, '#ff1744', 30);
          return { ...currentSnake, isAlive: false };
        }
      }

      // Circular perimeter bounds warping (always allow crossing/crossing walls)
      if (boardType === 'circular') {
        const cx = gridWidth / 2;
        const cy = gridHeight / 2;
        const dist = Math.sqrt(Math.pow(nextHead.x - cx, 2) + Math.pow(nextHead.y - cy, 2));
        if (dist >= gridWidth / 2 - 0.4) {
          const dx = nextHead.x - cx;
          const dy = nextHead.y - cy;
          nextHead.x = Math.round(cx - dx);
          nextHead.y = Math.round(cy - dy);
          nextHead.x = (nextHead.x + gridWidth) % gridWidth;
          nextHead.y = (nextHead.y + gridHeight) % gridHeight;
        }
      }

      // Check body segment collisions (hits self or hits other snake body)
      let bodyHitSelf = false;
      let bodyHitOtherSnake = false;

      snakes.forEach(otherS => {
        const startSegIdx = otherS.id === currentSnake.id ? 1 : 0; // skip own head
        for (let s = startSegIdx; s < otherS.body.length; s++) {
          const seg = otherS.body[s];
          if (seg.x === nextHead.x && seg.y === nextHead.y) {
            if (otherS.id === currentSnake.id) bodyHitSelf = true;
            else bodyHitOtherSnake = true;
          }
        }
      });

      if (bodyHitSelf || bodyHitOtherSnake) {
        const shieldActive = currentSnake.activePowerups['shield'] !== undefined;
        if (shieldActive) {
          audio.playCollision();
          triggerBurst(nextHead.x, nextHead.y, '#2979ff', 25);
          triggerFloater(nextHead.x, nextHead.y, 'BODY BOUNCE', '#2979ff');
          const nextPowerUps = { ...currentSnake.activePowerups };
          delete nextPowerUps['shield'];
          return { ...currentSnake, activePowerups: nextPowerUps };
        } else {
          audio.playGameOver();
          triggerBurst(nextHead.x, nextHead.y, '#ff0055', 30);
          return { ...currentSnake, isAlive: false };
        }
      }

      // Safe to move! Check food captures next
      const snakeBody = [...currentSnake.body];
      let didEat = false;
      let eatenFoodId = '';

      foods.forEach(f => {
        if (f.x === nextHead.x && f.y === nextHead.y) {
          didEat = true;
          eatenFoodId = f.id;

          // Compute score and active multipliers
          const isDoubleActive = currentSnake.activePowerups['double_score'] !== undefined;
          const pointsAwarded = Math.round(
            f.points * MULTIPLIERS[difficulty] * (isDoubleActive ? 2 : 1) * comboMultiplier
          );

          currentSnake.score += pointsAwarded;

          // Increment survival achievements triggers
          if (snakeId === 1) {
            setStreakCount(prev => prev + 1);
            setComboTimer(8); // refreshed 8 ticks remaining
            setComboMultiplier(prev => (streakCount > 0 && streakCount % 3 === 0 ? prev + 1 : prev));
          }

          // Trigger feedback signals
          if (f.isPowerUp && f.powerUpType) {
            audio.playPowerUp();
            triggerFloater(nextHead.x, nextHead.y, `${f.name.toUpperCase()} ON!`, f.color);
            triggerBurst(nextHead.x, nextHead.y, f.color, 35);
            
            // Set power-up active conditions
            if (f.powerUpType === 'growth') {
              // instant grow + extra points
              snakeBody.push({ ...snakeBody[snakeBody.length - 1] });
              snakeBody.push({ ...snakeBody[snakeBody.length - 1] });
            } else if (f.powerUpType === 'shrink') {
              // instant trim 3 segments helper
              if (snakeBody.length > 3) {
                snakeBody.splice(-3);
              }
              triggerFloater(nextHead.x, nextHead.y, 'SHRUNK SPEEDY!', '#00ff3c');
            } else {
              const config = POWER_UP_PACK.find(p => p.type === f.powerUpType);
              currentSnake.activePowerups[f.powerUpType] = config ? config.durationMs : 10000;
            }
          } else {
            // Normal Edible Fruit
            audio.playEat();
            triggerFloater(nextHead.x, nextHead.y, `+${pointsAwarded} ${f.name.toUpperCase()}`, f.color);
            triggerBurst(nextHead.x, nextHead.y, f.color, 20);
          }
        }
      });

      // Update body parts coordinates
      snakeBody.unshift(nextHead);
      if (!didEat) {
        snakeBody.pop();
      }

      // Check magnet power-up: attracted food segments shift towards head
      const isMagnetActive = currentSnake.activePowerups['magnet'] !== undefined;
      if (isMagnetActive && !didEat) {
        setFoods(prevFoods =>
          prevFoods.map(f => {
            const dist = Math.abs(f.x - nextHead.x) + Math.abs(f.y - nextHead.y);
            if (dist <= 4) { // within magnetic vacuum range
              // Pull food closer
              const dx = Math.sign(nextHead.x - f.x);
              const dy = Math.sign(nextHead.y - f.y);
              return {
                ...f,
                x: f.x + dx,
                y: f.y + dy,
              };
            }
            return f;
          })
        );
      }

      // Subtract durations of active powerups
      const nextPowerUps: { [key in PowerUpType]?: number } = {};
      Object.keys(currentSnake.activePowerups).forEach(key => {
        const val = currentSnake.activePowerups[key as PowerUpType];
        if (val && val > gameStepSpeed.current) {
          nextPowerUps[key as PowerUpType] = val - gameStepSpeed.current;
        }
      });

      // Update reactive powerup state bindings
      return {
        ...currentSnake,
        body: snakeBody,
        activePowerups: nextPowerUps,
        shieldActive: nextPowerUps['shield'] !== undefined,
        ghostActive: nextPowerUps['ghost'] !== undefined,
        magnetActive: nextPowerUps['magnet'] !== undefined,
      };
    });

    // Cleanup eaten foods and respawn replacements
    const currentFoodsRemaining = foods.filter(f => !snakes.some(s => s.body[0].x === f.x && s.body[0].y === f.y));
    let nextFoods = [...currentFoodsRemaining];
    if (nextFoods.length < (boardType === 'large' ? 4 : 2)) {
      const occupied = new Set<string>();
      nextSnakes.forEach(snk => snk.body.forEach(b => occupied.add(`${b.x},${b.y}`)));
      nextObstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));

      const foodToAdd = (boardType === 'large' ? 4 : 2) - nextFoods.length;
      for (let k = 0; k < foodToAdd; k++) {
        const newFood = getRandomFreeFood(occupied, nextObstacles, nextFoods, gridWidth, gridHeight, boardType);
        if (newFood) nextFoods.push(newFood);
      }
    }
    setFoods(nextFoods);
    setSnakes(nextSnakes);

    // Save game state locally
    try {
      localStorage.setItem('neon_snake_active_session', JSON.stringify({
        snakes: nextSnakes,
        foods: nextFoods,
        boardType,
        difficulty,
        gameMode,
        secondsSurvived,
        skin,
        comboMultiplier,
      }));
    } catch (e) {
      console.warn('Failed auto-saving progress', e);
    }
  };

  // 3. Custom Clock Timer loop that speeds or slows snake speed based on power-ups
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    let baseSpeed = SPEEDS[difficulty];

    const tick = (now: number) => {
      // Find player 1 speed modifications
      const p1 = snakes.find(s => s.id === 1);
      let calculatedSpeed = baseSpeed;
      if (p1) {
        if (p1.activePowerups['speed_boost'] !== undefined) calculatedSpeed = Math.round(baseSpeed * 0.6); // fast tick
        else if (p1.activePowerups['slow_motion'] !== undefined) calculatedSpeed = Math.round(baseSpeed * 1.55); // chilled tick
      }

      gameStepSpeed.current = calculatedSpeed;

      if (!lastTickTime.current) {
        lastTickTime.current = now;
      }

      const elapsed = now - lastTickTime.current;
      if (elapsed >= calculatedSpeed) {
        runGameStep();
        lastTickTime.current = now;
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, isPaused, snakes, foods, obstacles, portals, difficulty, boardType]);

  // 4. Floating Score Emitters & Canvas Render pipeline running continuously at 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrameId: number;

    const render = () => {
      // Clear with dark grid overlay spacing
      ctx.fillStyle = '#020617'; // slate-950 dark blackish-blue
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw aesthetic scanlines & outer neon grid lines
      drawGridBackground(ctx, canvas.width, canvas.height, gridWidth, gridHeight, boardType);

      // Draw static/moving obstacles
      drawObstacles(ctx, obstacles, canvas.width, canvas.height, gridWidth, gridHeight);

      // Draw Teleport Portals
      drawPortals(ctx, portals, canvas.width, canvas.height, gridWidth, gridHeight);

      // Draw Glowing Food Items
      drawFoods(ctx, foods, canvas.width, canvas.height, gridWidth, gridHeight);

      // Draw Snakes with beautiful rounded neon paths & blinking eyes
      drawSnakes(ctx, snakes, canvas.width, canvas.height, gridWidth, gridHeight);

      // Draw Circular perimeter bounds
      if (boardType === 'circular') {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 4.0;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Draw Particle explosions
      updateAndDrawParticles(ctx);

      // Draw Floating Indicators
      updateAndDrawFloaters(ctx);

      localFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(localFrameId);
    };
  }, [snakes, foods, obstacles, portals]);

  // Drawing helper methods
  const drawGridBackground = (
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    gw: number,
    gh: number,
    type: BoardType
  ) => {
    // Draws vertical/horizontal lines
    const cellW = cw / gw;
    const cellH = ch / gh;

    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)'; // slate-800 subtle
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= gw; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, ch);
      ctx.stroke();
    }
    for (let j = 0; j <= gh; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellH);
      ctx.lineTo(cw, j * cellH);
      ctx.stroke();
    }

    // No blocking solid outer walls! The grid is fully transparent and wrap-around.
  };

  const drawObstacles = (
    ctx: CanvasRenderingContext2D,
    arr: Obstacle[],
    cw: number,
    ch: number,
    gw: number,
    gh: number
  ) => {
    const cellW = cw / gw;
    const cellH = ch / gh;

    arr.forEach(ob => {
      const rx = ob.x * cellW + 2;
      const ry = ob.y * cellH + 2;
      const rw = cellW - 4;
      const rh = cellH - 4;

      ctx.save();
      // Glowing border fuchsia/purple
      ctx.fillStyle = '#a855f7'; // purple-500
      ctx.shadowColor = 'rgba(168, 85, 247, 0.85)';
      ctx.shadowBlur = 10;
      
      // Draw rounded block
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 4);
      ctx.fill();

      // Custom internal pattern
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.restore();
    });
  };

  const drawPortals = (
    ctx: CanvasRenderingContext2D,
    arr: Portal[],
    cw: number,
    ch: number,
    gw: number,
    gh: number
  ) => {
    const cellW = cw / gw;
    const cellH = ch / gh;

    arr.forEach(p => {
      const x = p.entry.x * cellW + cellW / 2;
      const y = p.entry.y * cellH + cellH / 2;
      const radius = cellW / 2.3;

      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;

      // Pulsing effect
      const pScale = 1.0 + 0.18 * Math.sin(Date.now() / 150);

      ctx.beginPath();
      ctx.arc(x, y, radius * pScale, 0, Math.PI * 2);
      ctx.stroke();

      // Core glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  const drawFoods = (
    ctx: CanvasRenderingContext2D,
    arr: FoodItem[],
    cw: number,
    ch: number,
    gw: number,
    gh: number
  ) => {
    const cellW = cw / gw;
    const cellH = ch / gh;

    arr.forEach(f => {
      const x = f.x * cellW + cellW / 2;
      const y = f.y * cellH + cellH / 2;

      ctx.save();
      ctx.shadowColor = f.glowColor;
      ctx.shadowBlur = 15;

      // Pulse scaling animation
      const scale = 1.0 + 0.15 * Math.sin(Date.now() / 150 + f.x);
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Render fruit symbol/emoji at center
      ctx.font = `${cellW * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.symbol, 0, 0);

      ctx.restore();
    });
  };

  const drawSnakes = (
    ctx: CanvasRenderingContext2D,
    arr: Snake[],
    cw: number,
    ch: number,
    gw: number,
    gh: number
  ) => {
    const cellW = cw / gw;
    const cellH = ch / gh;

    arr.forEach(snake => {
      if (snake.body.length === 0) return;

      const skinConfig = SKINS.find(s => s.type === snake.skin);
      const isRainbow = snake.skin === 'rainbow';
      const isFire = snake.skin === 'fire';

      // Draw body segments with rounded neon path lines
      snake.body.forEach((seg, index) => {
        const isHead = index === 0;
        const x = seg.x * cellW + cellW / 2;
        const y = seg.y * cellH + cellH / 2;

        ctx.save();

        if (isHead) {
          // Draw head block
          ctx.beginPath();
          ctx.arc(x, y, cellW / 1.8, 0, Math.PI * 2);
          
          let hColor = snake.color;
          if (isRainbow) hColor = '#ff2255';
          else if (isFire) hColor = '#ff5b00';

          ctx.fillStyle = hColor;
          ctx.shadowColor = hColor;
          ctx.shadowBlur = 15;
          ctx.fill();

          // Animated Blinking Eyes on Head based on direction
          const dir = snake.direction;
          const eyeOffsetRadius = cellW * 0.22;
          
          // Determine eyes coordinates relative to face direction
          let e1 = { dx: -eyeOffsetRadius, dy: -eyeOffsetRadius };
          let e2 = { dx: eyeOffsetRadius, dy: -eyeOffsetRadius };

          if (dir.x !== 0) {
            e1 = { dx: dir.x * eyeOffsetRadius, dy: -eyeOffsetRadius };
            e2 = { dx: dir.x * eyeOffsetRadius, dy: eyeOffsetRadius };
          } else if (dir.y !== 0) {
            e1 = { dx: -eyeOffsetRadius, dy: dir.y * eyeOffsetRadius };
            e2 = { dx: eyeOffsetRadius, dy: dir.y * eyeOffsetRadius };
          }

          // Random blinking cycle
          const isBlinking = blinkTimerRef.current[snake.id] > 0;
          if (isBlinking) {
            blinkTimerRef.current[snake.id]--;
          } else if (Math.random() < 0.012) {
            blinkTimerRef.current[snake.id] = 6; // blink for 6 frames
          }

          ctx.fillStyle = isBlinking ? '#000000' : '#ffffff';
          ctx.shadowBlur = 0; // turn off shadow for eyes

          ctx.beginPath();
          ctx.arc(x + e1.dx, y + e1.dy, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x + e2.dx, y + e2.dy, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Draw floating active power-up shield indicator dome around head
          const hasShield = snake.activePowerups['shield'] !== undefined;
          if (hasShield) {
            ctx.strokeStyle = '#2979ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#2979ff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(x, y, cellW * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }

        } else {
          // Body segments rendering
          const ratio = index / snake.body.length;
          let segColor = snake.color;

          if (isRainbow && skinConfig) {
            const h = (index * 42) % 360;
            segColor = `hsl(${h}, 95%, 55%)`;
          } else if (isFire && skinConfig) {
            const fireColors = ['#ef4444', '#f97316', '#eab308'];
            segColor = fireColors[index % fireColors.length];
          }

          const radius = (cellW / (2.2 + ratio * 1.2)); // tapering tail

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);

          ctx.fillStyle = segColor;
          ctx.shadowColor = segColor;
          ctx.shadowBlur = index < 8 ? 10 - index : 2; // fading fade glow
          ctx.fill();
        }

        ctx.restore();
      });
    });
  };

  // Particle management inside canvas redraw
  const triggerBurst = (gx: number, gy: number, color: string, amt: number = 15) => {
    // Project into canvas coordinates
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const cellW = cw / gridWidth;
    const cellH = ch / gridHeight;

    const px = gx * cellW + cellW / 2;
    const py = gy * cellH + cellH / 2;

    const newParticles: Particle[] = [];
    for (let i = 0; i < amt; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      const maxLife = Math.random() * 25 + 16;
      newParticles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 1.8,
        life: maxLife,
        maxLife,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    const list = particlesRef.current;
    if (list.length === 0) return;

    ctx.save();
    const nextList: Particle[] = [];

    list.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life > 0) {
        // Fading opacity ratio
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        nextList.push(p);
      }
    });

    ctx.restore();
    particlesRef.current = nextList;
  };

  // Floating text indicators
  const triggerFloater = (gx: number, gy: number, text: string, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellW = canvas.width / gridWidth;
    const cellH = canvas.height / gridHeight;

    const px = gx * cellW + cellW / 2;
    const py = gy * cellH;

    const f: FloatingIndicator = {
      x: px,
      y: py,
      text,
      color,
      life: 45,
      maxLife: 45,
    };
    floatersRef.current = [...floatersRef.current, f];
  };

  const updateAndDrawFloaters = (ctx: CanvasRenderingContext2D) => {
    const list = floatersRef.current;
    if (list.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px JetBrains Mono, monospace';

    const nextList: FloatingIndicator[] = [];

    list.forEach(f => {
      f.y -= 0.6; // float up
      f.life--;

      if (f.life > 0) {
        const ratio = f.life / f.maxLife;
        ctx.fillStyle = f.color;
        ctx.globalAlpha = ratio;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 6;

        ctx.fillText(f.text, f.x, f.y);
        nextList.push(f);
      }
    });

    ctx.restore();
    floatersRef.current = nextList;
  };

  // Helper actions
  const restartGame = () => {
    audio.playLevelUp();
    // Flush storage first
    localStorage.removeItem('neon_snake_active_session');
    
    // Trigger reset of values
    setSecondsSurvived(0);
    setComboMultiplier(1);
    setStreakCount(0);
    setComboTimer(0);

    const middleY = Math.floor(gridHeight / 2);
    const p1Initial: Snake = {
      id: 1,
      name: isPvP || isCoop ? 'NEON-S1' : 'P1-CORE',
      body: [
        { x: 5, y: middleY },
        { x: 4, y: middleY },
        { x: 3, y: middleY },
      ],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      score: 0,
      skin: skin,
      isAlive: true,
      isAI: false,
      color: SKINS.find(s => s.type === skin)?.color || '#10b981',
      activePowerups: {},
      shieldActive: false,
      ghostActive: false,
      magnetActive: false,
    };

    snakesDirectionsRef.current[1] = { dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 } };

    const initialSnakes = [p1Initial];

    if (isCoop || isPvP || isAIOpponent) {
      const altSkin = skin === 'blue' ? 'purple' : 'blue';
      const p2Name = isAIOpponent ? 'CYBER-BOT' : 'NEON-S2';
      const otherY = middleY - 3 > 1 ? middleY - 3 : middleY + 3;

      const p2Initial: Snake = {
        id: 2,
        name: p2Name,
        body: [
          { x: gridWidth - 6, y: otherY },
          { x: gridWidth - 5, y: otherY },
          { x: gridWidth - 4, y: otherY },
        ],
        direction: { x: -1, y: 0 },
        nextDirection: { x: -1, y: 0 },
        score: 0,
        skin: altSkin,
        isAlive: true,
        isAI: isAIOpponent,
        color: SKINS.find(s => s.type === altSkin)?.color || '#3b82f6',
        activePowerups: {},
        shieldActive: false,
        ghostActive: false,
        magnetActive: false,
      };
      
      initialSnakes.push(p2Initial);
      snakesDirectionsRef.current[2] = { dir: { x: -1, y: 0 }, nextDir: { x: -1, y: 0 } };
    }

    setSnakes(initialSnakes);

    // Reposition Initial Foods
    const initialFoodCount = boardType === 'large' ? 4 : 2;
    const initialFoods: FoodItem[] = [];
    const occupied = new Set<string>();

    initialSnakes.forEach(snk => snk.body.forEach(b => occupied.add(`${b.x},${b.y}`)));
    obstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));

    for (let i = 0; i < initialFoodCount; i++) {
      const f = getRandomFreeFood(occupied, obstacles, initialFoods, gridWidth, gridHeight, boardType);
      if (f) initialFoods.push(f);
    }
    setFoods(initialFoods);

    setIsPaused(false);
    setIsPlaying(true);
    audio.startMusic();
  };

  const endTheSession = () => {
    setIsPlaying(false);
    audio.stopMusic();
    localStorage.removeItem('neon_snake_active_session');

    // Aggregate scores and bubble up
    const p1 = snakes.find(s => s.id === 1);
    const p2 = snakes.find(s => s.id === 2);
    onGameOver(p1 ? p1.score : 0, p2 ? p2.score : 0);
  };

  const saveAndExit = () => {
    audio.playClick();
    onExit();
  };

  // Master Score displays
  const player1 = snakes.find(s => s.id === 1);
  const player2 = snakes.find(s => s.id === 2);

  // Dynamic active buffs mapper for the sidebar
  const activeBuffsList = player1 && player1.activePowerups
    ? Object.entries(player1.activePowerups)
        .filter(([_, dur]) => typeof dur === 'number' && dur > 0)
        .map(([type, dur]) => {
          let name = 'UNKNOWN';
          let symbol = '⚡';
          let color = 'text-cyan-400';
          let border = 'border-cyan-500/20';
          let bg = 'bg-cyan-500/10';
          let barBg = 'bg-cyan-400';

          if (type === 'speed_boost') {
            name = 'Hyper Speed';
            symbol = '⚡';
            color = 'text-cyan-400';
            border = 'border-cyan-500/20';
            bg = 'bg-cyan-500/10';
            barBg = 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]';
          } else if (type === 'slow_motion') {
            name = 'Slow Motion';
            symbol = '❄️';
            color = 'text-blue-400';
            border = 'border-blue-500/20';
            bg = 'bg-blue-500/10';
            barBg = 'bg-blue-400 shadow-[0_0_8px_#3b82f6]';
          } else if (type === 'double_score') {
            name = 'Double Points';
            symbol = '💎';
            color = 'text-fuchsia-400';
            border = 'border-fuchsia-500/20';
            bg = 'bg-fuchsia-500/10';
            barBg = 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]';
          } else if (type === 'shield') {
            name = 'Shield Orb';
            symbol = '🛡️';
            color = 'text-indigo-400';
            border = 'border-indigo-500/20';
            bg = 'bg-indigo-500/10';
            barBg = 'bg-indigo-400 shadow-[0_0_8px_#6366f1]';
          } else if (type === 'ghost') {
            name = 'Ghost Mode';
            symbol = '👻';
            color = 'text-pink-400';
            border = 'border-pink-500/20';
            bg = 'bg-pink-500/10';
            barBg = 'bg-pink-400 shadow-[0_0_8px_#ec4899]';
          } else if (type === 'magnet') {
            name = 'Magnetizer';
            symbol = '🧲';
            color = 'text-amber-400';
            border = 'border-amber-500/20';
            bg = 'bg-amber-500/10';
            barBg = 'bg-amber-400 shadow-[0_0_8px_#f59e0b]';
          }

          const maxDur = type === 'shield' ? 15000 : type === 'double_score' ? 10000 : 7000;
          const pct = Math.min(100, Math.ceil(((dur as number) / maxDur) * 100));

          return { type, name, symbol, color, border, bg, barBg, pct, dur };
        })
    : [];

  return (
    <div id="game-arena-grid" className="flex flex-col w-full max-w-5xl bg-[#020617] text-white font-sans overflow-hidden border-8 border-[#0f172a] rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.15)] select-none animate-fade-in">
      
      {/* Top Header / Dashboard */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-2 border-b border-cyan-500/25 bg-slate-900/40 backdrop-blur-md gap-3">
        <div className="flex flex-col text-center sm:text-left">
          <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            SNAKE GAME
          </h1>
          <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-400/70 font-bold">PANAVERSITY</span>
        </div>

        <div className="flex flex-wrap gap-6 sm:gap-10 items-center justify-center font-mono">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Current Level</p>
            <p className="text-2xl font-mono text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
              {Math.floor((player1 ? player1.score : 0) / 100) + 1}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Combo</p>
            <p className="text-2xl font-mono text-fuchsia-400">
              x{comboMultiplier.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Time Survived</p>
            <p className="text-2xl font-mono text-slate-205">
              {String(Math.floor(secondsSurvived / 60)).padStart(2, '0')}:
              {String(secondsSurvived % 60).padStart(2, '0')}
            </p>
          </div>
          <button 
            id="btn-play-pause-toggle"
            onClick={() => { audio.playClick(); setIsPaused(prev => !prev); }}
            className="px-6 py-2 bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-full transition-colors text-xs font-bold font-sans cursor-pointer uppercase tracking-wider text-slate-200"
          >
            {isPaused ? 'RESUME (SPACE)' : 'PAUSE (SPACE)'}
          </button>
        </div>
      </header>

      {/* Main Game Layout Columns */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 w-full items-stretch">
        
        {/* Left Sidebar: Progress & Fruit */}
        <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-mono">Player Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400 uppercase">Score ({player1 ? player1.name : 'P1'})</span>
                  <span className="text-cyan-400 font-bold">{player1 ? player1.score : 0}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.ceil(((player1 ? player1.score : 0) / Math.max(100, highScore)) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {player2 && (
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400 uppercase">{player2.name}</span>
                    <span className="text-purple-400 font-bold">{player2.score}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 shadow-[0_0_8px_#a855f7] transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.ceil((player2.score / Math.max(100, highScore)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-400 uppercase">High Score</span>
                  <span className="text-fuchsia-400 font-bold">{Math.max(highScore, player1 ? player1.score : 0)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500 w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-mono">Fruit Catalog</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col items-center p-2.5 bg-slate-800/40 rounded-xl border border-transparent hover:border-lime-500/50 transition">
                <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-400 shadow-[0_0_10px_rgba(132,204,22,0.3)] mb-1 text-xs">🍎</div>
                <span className="text-[9px] text-lime-400 font-mono font-bold uppercase">APPLE (+10)</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-slate-800/40 rounded-xl border border-transparent hover:border-yellow-500/50 transition">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] mb-1 text-xs">🍌</div>
                <span className="text-[9px] text-yellow-400 font-mono font-bold uppercase">BANANA (+15)</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-slate-800/40 rounded-xl border border-transparent hover:border-pink-500/50 transition">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] mb-1 text-xs">🍓</div>
                <span className="text-[9px] text-pink-400 font-mono font-bold uppercase">BERRY (+25)</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/50 transition">
                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)] mb-1 text-xs">💎</div>
                <span className="text-[9px] text-fuchsia-400 font-mono font-bold uppercase">GEM (+100)</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: The Grid */}
        <section className="flex-1 relative bg-[#020617] rounded-3xl overflow-hidden shadow-[inset_0_0_60px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center p-4 min-h-[440px]">
          {/* Aesthetic grid overlay */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(34,211,238,0.03),rgba(168,85,247,0.01),rgba(244,63,94,0.03))] pointer-events-none" />

          <div className="relative flex items-center justify-center w-full z-10 my-auto">
            <canvas
              id="neon-snake-canvas"
              ref={canvasRef}
              width={600}
              height={600}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="max-w-full aspect-square rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.15)] cursor-crosshair TouchAction-none bg-slate-950/90"
              style={{ width: '400px', height: '400px' }}
            />

            {/* Pause Overlay Glassmorphic Dashboard */}
            {isPaused && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in rounded-lg">
                <HelpCircle className="w-12 h-12 text-cyan-400 animate-bounce mb-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
                <h3 className="text-xl font-bold uppercase tracking-widest text-slate-100 font-mono">
                  SYSTEM MATRIX PAUSED
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 max-w-xs leading-relaxed">
                  Tap Spacebar or the play button to resume steer calculations.
                </p>

                <div className="flex flex-col gap-2.5 mt-6 w-48 font-sans">
                  <button
                    id="btn-pause-resume"
                    onClick={() => { audio.playClick(); setIsPaused(false); }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-lg text-xs tracking-widest cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition"
                  >
                    RESUME MATRIX
                  </button>
                  <button
                    id="btn-pause-restart"
                    onClick={restartGame}
                    className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> RESET SESSION
                  </button>
                  <button
                    id="btn-pause-exit"
                    onClick={saveAndExit}
                    className="w-full py-2 bg-slate-900 border border-slate-800 text-rose-500 font-bold rounded-lg text-xs cursor-pointer hover:bg-rose-955/20 transition flex items-center justify-center gap-1"
                  >
                    <Home className="w-3.5 h-3.5" /> SAVE & EXIT LOBBY
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HUD Bottom Notification */}
          {comboTimer > 0 && (
            <div className="mt-4 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full z-10 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300">
                Combo Streak Mult Active: {comboTimer}s Left
              </span>
            </div>
          )}

          {/* Cyber Mobile Virtual D-PAD Controller Panel */}
          <div id="virtual-dpad-controller" className="flex flex-col items-center gap-1.5 mt-4 font-mono select-none sm:hidden z-10">
            <span className="text-[9px] text-slate-500 tracking-wider">TOUCH DIRECTIONS STEER</span>
            
            {/* DPAD UP */}
            <button
              id="btn-dpad-up"
              onTouchStart={() => handleVirtualDpadPress('up')}
              onClick={() => handleVirtualDpadPress('up')}
              className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full text-slate-300 active:text-cyan-300 transition-all shadow-lg cursor-pointer text-xs"
            >
              ▲
            </button>

            {/* DPAD LEFT/RIGHT ROW */}
            <div className="flex gap-12 items-center justify-center">
              <button
                id="btn-dpad-left"
                onTouchStart={() => handleVirtualDpadPress('left')}
                onClick={() => handleVirtualDpadPress('left')}
                className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full text-slate-300 active:text-cyan-300 transition-all shadow-lg cursor-pointer text-xs"
              >
                ◀
              </button>
              <button
                id="btn-dpad-right"
                onTouchStart={() => handleVirtualDpadPress('right')}
                onClick={() => handleVirtualDpadPress('right')}
                className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full text-slate-300 active:text-cyan-300 transition-all shadow-lg cursor-pointer text-xs"
              >
                ▶
              </button>
            </div>

            {/* DPAD DOWN */}
            <button
              id="btn-dpad-down"
              onTouchStart={() => handleVirtualDpadPress('down')}
              onClick={() => handleVirtualDpadPress('down')}
              className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full text-slate-300 active:text-cyan-300 transition-all shadow-lg cursor-pointer text-xs"
            >
              ▼
            </button>
          </div>
        </section>

        {/* Right Sidebar: Active Power Ups & Leaderboard */}
        <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 w-full text-left font-mono">Current Buffs</h3>
            <div className="w-full space-y-2 max-h-48 overflow-y-auto">
              {activeBuffsList.length === 0 ? (
                <div className="p-4 bg-slate-850/20 text-center rounded-xl border border-dashed border-slate-800/80 text-[10px] text-slate-500 tracking-wider font-mono font-bold uppercase">
                  SYSTEM CLEAN: NO CYBER BUFFS
                </div>
              ) : (
                activeBuffsList.map(buff => (
                  <div key={buff.type} className={`flex items-center gap-3 p-2 bg-slate-850/80 border ${buff.border} rounded-xl`}>
                    <div className="text-lg">{buff.symbol}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${buff.color} truncate`}>{buff.name}</p>
                      <div className="h-1 bg-slate-800 w-full mt-1 rounded-full overflow-hidden">
                        <div className={`h-full ${buff.barBg} transition-all duration-300`} style={{ width: `${buff.pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-mono">Leaderboard</h3>
            <div className="space-y-3">
              {(() => {
                const list = [...sidebarLeaderboard];
                while (list.length < 3) {
                  list.push({ name: 'SYS_MATRIX_A', score: Math.max(100, 25000 - list.length * 6000), difficulty: 'medium', board: 'classic', date: '---' });
                }
                return list.slice(0, 5).map((entry, idx) => {
                  const isUserCurrent = player1 && entry.name === 'USER MATRIX' && entry.score === player1.score;
                  return (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-1.5 rounded-lg ${isUserCurrent ? 'bg-cyan-400/10 border border-cyan-400/20' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono ${isUserCurrent ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-white truncate w-24 font-mono uppercase">{entry.name}</span>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{entry.score}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </aside>

      </main>

      {/* Global Status Footer with extra padding and generous space */}
      <footer className="mt-6 mb-2 flex flex-col sm:flex-row items-center justify-between px-10 py-6 bg-slate-950/80 border border-slate-800/80 text-[10px] tracking-[0.2em] font-medium text-slate-400 uppercase gap-4 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-2 items-center sm:items-start">
          <div className="flex flex-wrap gap-4 sm:gap-8 justify-center sm:justify-start text-center">
            <span className="hover:text-cyan-400 transition duration-200">STEER: ARROWS / WASD</span>
            <span className="hover:text-cyan-400 transition duration-200">PAUSE: SPACE BAR</span>
            <span className="hover:text-cyan-400 transition duration-200">RESTART: KEY R</span>
            <span className="hover:text-cyan-400 transition duration-200">EXIT: KEY ESC</span>
          </div>
          <span className="text-purple-400 font-bold tracking-widest text-[11px] mt-1 text-center sm:text-left">
            DEVELOPED BY MUHAMMAD IDREES
          </span>
        </div>
        <div className="flex gap-6 items-center font-mono text-slate-400">
          <span className="px-2 py-0.5 text-[9px] border border-cyan-500/30 text-cyan-400/80 rounded bg-cyan-950/20 font-bold uppercase tracking-widest">
            WRAP-AROUND ACTIVE
          </span>
          <span className="text-cyan-400/80 animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 bg-cyan-400 rounded-full inline-block shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            CYBER-GRID SECURE
          </span>
          <span className="px-2 py-0.5 border border-slate-700 rounded text-slate-500 font-bold">FPS: 60</span>
        </div>
      </footer>

    </div>
  );
}
