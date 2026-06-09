import React, { useState, useEffect } from 'react';
import { Difficulty, BoardType, SkinType, GameMode, LeaderboardEntry, GameStats, Achievement, Point } from './types';
import { INITIAL_ACHIEVEMENTS } from './constants';
import { audio } from './utils/audio';

// Dynamic sub-components
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';
import GameOverMenu from './components/GameOverMenu';
import CustomBoardEditor from './components/CustomBoardEditor';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'custom_editor'>('menu');

  // Active configurations
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [boardType, setBoardType] = useState<BoardType>('classic');
  const [skin, setSkin] = useState<SkinType>('green');
  const [gameMode, setGameMode] = useState<GameMode>('single');

  // Dynamic game values
  const [recentP1Score, setRecentP1Score] = useState(0);
  const [recentP2Score, setRecentP2Score] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Persistence Stats
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    highestScore: 0,
    totalFoodCollected: 0,
    longestSnakeLength: 3,
    timePlayed: 0
  });
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Saved Game Session
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionState, setSavedSessionState] = useState<any>(null);

  // Custom drawn level
  const [hasCustomObstacles, setHasCustomObstacles] = useState(false);
  const [customObstacles, setCustomObstacles] = useState<Point[]>([]);

  // 1. Fetch persistent logs on initial frame open
  useEffect(() => {
    // Leadboard retrieval
    const storedLeaderboard = localStorage.getItem('neon_snake_leaderboard');
    if (storedLeaderboard) {
      try {
        setLeaderboard(JSON.parse(storedLeaderboard));
      } catch (e) {
        console.error('Failed reading leaderboard logs', e);
      }
    }

    // Diagnostics Stats retrieval
    const storedStats = localStorage.getItem('neon_snake_stats');
    if (storedStats) {
      try {
        setStats(JSON.parse(storedStats));
      } catch (e) {
        console.error('Failed reading stats logs', e);
      }
    }

    // Medals unlocked checklist retrieval
    const storedAchievements = localStorage.getItem('neon_snake_achievements');
    if (storedAchievements) {
      try {
        const parsed = JSON.parse(storedAchievements) as Achievement[];
        // Merge with initial definitions to fetch any newly released ones
        const merged = INITIAL_ACHIEVEMENTS.map(initial => {
          const match = parsed.find(p => p.id === initial.id);
          return match ? { ...initial, unlocked: match.unlocked, progressCurrent: match.progressCurrent ?? initial.progressCurrent } : initial;
        });
        setAchievements(merged);
      } catch (e) {
        console.error('Failed reading achievements logs', e);
      }
    }

    // Active custom board layout coordinates
    const storedCustom = localStorage.getItem('neon_snake_custom_obstacles');
    if (storedCustom) {
      try {
        const parsedPts = JSON.parse(storedCustom) as Point[];
        setCustomObstacles(parsedPts);
        setHasCustomObstacles(parsedPts.length > 0);
      } catch (e) {
        console.error('Failed reading custom elements obstacles', e);
      }
    }

    // Session recovery checklist
    checkForSavedSession();
  }, []);

  const checkForSavedSession = () => {
    const activeSession = localStorage.getItem('neon_snake_active_session');
    if (activeSession) {
      try {
        const parsed = JSON.parse(activeSession);
        setSavedSessionState(parsed);
        setHasSavedSession(true);

        // sync current setups
        setDifficulty(parsed.difficulty);
        setBoardType(parsed.boardType);
        setGameMode(parsed.gameMode);
        setSkin(parsed.skin);
      } catch (e) {
        console.warn('Failed reading active game session', e);
        setHasSavedSession(false);
      }
    } else {
      setHasSavedSession(false);
    }
  };

  // Saved Session launch handler
  const handleResumeSavedSession = () => {
    audio.playLevelUp();
    setGameState('playing');
  };

  // Fresh setup launch handler
  const handleStartFreshGame = () => {
    // Clear old state
    localStorage.removeItem('neon_snake_active_session');
    setSavedSessionState(null);
    setHasSavedSession(false);
    setRecentP1Score(0);
    setRecentP2Score(0);
    setIsNewHighScore(false);

    setGameState('playing');
  };

  // Save painted custom walls from Board Editor
  const handleSaveCustomBoard = (obstacles: Point[]) => {
    try {
      localStorage.setItem('neon_snake_custom_obstacles', JSON.stringify(obstacles));
      setCustomObstacles(obstacles);
      setHasCustomObstacles(obstacles.length > 0);
      setBoardType('custom' as any); // Swap to use it currently!
      setGameState('menu');
    } catch (e) {
      console.error('Failed saving custom obstacle elements', e);
    }
  };

  // Evaluate scores, update leaderboards, update stats, evaluate achievements
  const handleGameOver = (p1Score: number, p2Score: number) => {
    setRecentP1Score(p1Score);
    setRecentP2Score(p2Score);

    const winningScore = Math.max(p1Score, p2Score);

    // Save game statistics increments
    let statsRecorded = { ...stats };
    statsRecorded.totalGames += 1;
    
    // Total foods approx counts (points roughly divided by base difficulty)
    const basePtsFactor = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10;
    const foodItemsEaten = Math.ceil(p1Score / basePtsFactor);
    statsRecorded.totalFoodCollected += foodItemsEaten;

    // Estimate approximate survival time play
    const estimatedSessionSeconds = Math.round(p1Score * 0.25) + 12;
    statsRecorded.timePlayed += estimatedSessionSeconds;

    // long snake length tracking estimate
    const achievedLengthEstimate = 3 + Math.floor(foodItemsEaten * 0.88);
    if (achievedLengthEstimate > statsRecorded.longestSnakeLength) {
      statsRecorded.longestSnakeLength = achievedLengthEstimate;
    }

    let p1IsNewHigh = false;
    if (p1Score > statsRecorded.highestScore) {
      statsRecorded.highestScore = p1Score;
      p1IsNewHigh = true;
    }
    setIsNewHighScore(p1IsNewHigh);
    setStats(statsRecorded);
    localStorage.setItem('neon_snake_stats', JSON.stringify(statsRecorded));

    // Handle Leaderboard insertion
    const nextEntry: LeaderboardEntry = {
      name: gameMode === 'single' ? 'USER MATRIX' : gameMode === 'versus_ai' ? 'USER VS BOT' : 'COOP TEAM',
      score: p1Score,
      difficulty,
      board: boardType,
      date: new Date().toLocaleDateString()
    };

    const updatedLeaderboard = [...leaderboard, nextEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10 scores
    
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('neon_snake_leaderboard', JSON.stringify(updatedLeaderboard));

    // Evaluate Achievements unlocked
    const updatedAchievements = achievements.map(ach => {
      if (ach.unlocked) return ach;

      let isUnlocked = false;
      let currentProgress = ach.progressCurrent || 0;

      if (ach.id === 'first_bite' && p1Score >= 10) {
        isUnlocked = true;
      }
      if (ach.id === 'fruit_collector') {
        currentProgress += foodItemsEaten;
        if (currentProgress >= (ach.progressMax || 100)) {
          isUnlocked = true;
          currentProgress = ach.progressMax || 100;
        }
      }
      if (ach.id === 'speed_master' && difficulty === 'hard' && p1Score >= 150) {
        isUnlocked = true;
      }
      if (ach.id === 'snake_king') {
        currentProgress = Math.max(currentProgress, achievedLengthEstimate);
        if (currentProgress >= (ach.progressMax || 25)) {
          isUnlocked = true;
          currentProgress = ach.progressMax || 25;
        }
      }
      if (ach.id === 'century' && p1Score >= 500) {
        isUnlocked = true;
      }

      if (isUnlocked && !ach.unlocked) {
        // Trigger visual/audio notifications
        audio.playLevelUp();
      }

      return {
        ...ach,
        unlocked: isUnlocked || ach.unlocked,
        progressCurrent: currentProgress,
      };
    });

    setAchievements(updatedAchievements);
    localStorage.setItem('neon_snake_achievements', JSON.stringify(updatedAchievements));

    // Save and route to result dashboard
    setGameState('gameover');
  };

  const handleReturnToLobby = () => {
    // Resync saved session status if we had just exited to menu
    checkForSavedSession();
    setGameState('menu');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col items-center justify-start pt-12 md:pt-20 px-4 pb-12 md:pb-16 relative overflow-y-auto overflow-x-hidden transition-colors duration-500">
      
      {/* Decorative cyber backdrop grid glows */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%),linear-gradient(90deg,rgba(6,182,212,0.03),rgba(168,85,247,0.03),rgba(244,63,94,0.03))] pointer-events-none" />
      <div className="absolute -top-[15%] -left-[15%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[15%] -right-[15%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <main className="w-full max-w-5xl relative z-10 flex flex-col items-center justify-center">
        
        {/* State Route Manager */}
        {gameState === 'menu' && (
          <MainMenu
            currentScore={recentP1Score}
            highestScore={stats.highestScore}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            selectedBoard={boardType}
            setSelectedBoard={setBoardType}
            selectedSkin={skin}
            setSelectedSkin={setSkin}
            gameMode={gameMode}
            setGameMode={setGameMode}
            onStartGame={handleStartFreshGame}
            hasSavedGame={hasSavedSession}
            onResumeGame={handleResumeSavedSession}
            leaderboard={leaderboard}
            achievements={achievements}
            stats={stats}
            onOpenCustomEditor={() => setGameState('custom_editor')}
            hasCustomObstacles={hasCustomObstacles}
          />
        )}

        {gameState === 'playing' && (
          <GameBoard
            difficulty={difficulty}
            boardType={boardType}
            skin={skin}
            gameMode={gameMode}
            onGameOver={handleGameOver}
            onExit={handleReturnToLobby}
            savedGameState={savedSessionState}
          />
        )}

        {gameState === 'gameover' && (
          <GameOverMenu
            p1Score={recentP1Score}
            p2Score={recentP2Score}
            difficulty={difficulty}
            boardType={boardType}
            gameMode={gameMode}
            onRestart={handleStartFreshGame}
            onExit={handleReturnToLobby}
            isNewHighScore={isNewHighScore}
          />
        )}

        {gameState === 'custom_editor' && (
          <CustomBoardEditor
            width={20}
            height={20}
            onSave={handleSaveCustomBoard}
            onCancel={() => setGameState('menu')}
            initialObstacles={customObstacles}
          />
        )}

      </main>

    </div>
  );
}
