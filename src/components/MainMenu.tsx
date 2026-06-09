import React, { useState, useEffect } from 'react';
import { 
  Play, Settings, RotateCcw, Award, BookOpen, BarChart3, Edit3, 
  User, Volume2, ShieldCheck, Cpu, Zap, Check, Swords, Flame 
} from 'lucide-react';
import { audio } from '../utils/audio';
import { Difficulty, BoardType, SkinType, GameMode, LeaderboardEntry, GameStats, Achievement } from '../types';
import { BOARDS, FRUIT_PACK, SKINS } from '../constants';
import AudioControls from './AudioControls';

interface MainMenuProps {
  currentScore: number;
  highestScore: number;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  selectedBoard: BoardType;
  setSelectedBoard: (b: BoardType) => void;
  selectedSkin: SkinType;
  setSelectedSkin: (s: SkinType) => void;
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  onStartGame: () => void;
  hasSavedGame: boolean;
  onResumeGame: () => void;
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  stats: GameStats;
  onOpenCustomEditor: () => void;
  hasCustomObstacles: boolean;
}

type MainTab = 'main' | 'setup' | 'leaderboard' | 'achievements' | 'instructions' | 'stats';

export default function MainMenu({
  currentScore,
  highestScore,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedBoard,
  setSelectedBoard,
  selectedSkin,
  setSelectedSkin,
  gameMode,
  setGameMode,
  onStartGame,
  hasSavedGame,
  onResumeGame,
  leaderboard,
  achievements,
  stats,
  onOpenCustomEditor,
  hasCustomObstacles,
}: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('main');

  const playClick = () => {
    audio.playClick();
  };

  const startNewGame = () => {
    audio.playLevelUp();
    onStartGame();
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] border-emerald-500/20';
      case 'medium': return 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] border-cyan-500/20';
      case 'hard': return 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)] border-rose-500/20';
    }
  };

  const activeAchievementCount = achievements.filter(a => a.unlocked).length;

  return (
    <div id="main-menu-container" className="flex flex-col items-center justify-between min-h-[580px] p-6 text-slate-100 max-w-4xl w-full mx-auto relative select-none">
      
      {/* GLOWING HEADER */}
      <header className="text-center my-2 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 rounded-lg blur-xl opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] uppercase font-sans">
          SNAKE GAME
        </h1>
        <p className="text-xs sm:text-[10px]/snug font-mono text-cyan-400 tracking-[0.2em] mt-1 uppercase">
          Panaversity
        </p>
      </header>

      {/* FLOATING STATUS INFO BANNER (No visual clutter, standard styling) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-900 font-mono text-center text-xs">
        <div>
          <span className="text-slate-500 block text-[10px]">PREVIOUS SCORE</span>
          <span className="text-pink-400 font-bold text-sm drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]">{currentScore}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">HIGHEST SCORE</span>
          <span className="text-cyan-400 font-bold text-sm drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]">{highestScore}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]/snug">DIFFICULTY</span>
          <span className={`font-bold capitalize text-sm ${getDifficultyColor(selectedDifficulty)}`}>{selectedDifficulty}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">BOARD TYPE</span>
          <span className="text-purple-400 font-bold capitalize text-sm drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]">{selectedBoard}</span>
        </div>
      </div>

      {/* CORE DISPLAY LOGIC */}
      <div id="menu-subpanels-wrapper" className="flex-1 w-full max-w-3xl flex flex-col justify-center min-h-[340px] relative">
        
        {/* 1. MAIN PANEL */}
        {activeTab === 'main' && (
          <div className="flex flex-col gap-6 w-full max-w-md mx-auto items-stretch justify-center py-4">
            {/* Buttons Column */}
            <div className="flex flex-col gap-3 justify-center">
              
              {hasSavedGame && (
                <button
                  id="btn-resume-game"
                  onClick={() => { playClick(); onResumeGame(); }}
                  className="group relative flex items-center justify-between w-full px-5 py-4 bg-slate-900 hover:bg-slate-800 border-2 border-emerald-500/80 hover:border-emerald-400 rounded-xl transition duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 px-1.5 rounded bg-emerald-500/10 text-emerald-400">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-emerald-400 text-sm tracking-wider">RESUME GAME</span>
                      <span className="block text-[10px] text-slate-400 font-mono">CONTINUE ACTIVE SPREAD</span>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              <button
                id="btn-play-instant"
                onClick={startNewGame}
                className="group relative flex items-center gap-4 w-full px-5 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-sans rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition duration-300 transform active:scale-98 cursor-pointer"
              >
                <div className="p-2 bg-slate-950/20 rounded-lg text-slate-950">
                  <Play className="w-6 h-6 fill-slate-950/40" />
                </div>
                <div className="text-left">
                  <span className="block text-base tracking-widest font-extrabold uppercase text-slate-950">PLAY GAME (START PLAY)</span>
                  <span className="block text-[10px] text-slate-900 mt-0.5 font-mono font-bold uppercase">LAUNCH INSTANTLY WITH CURRENT SETTINGS</span>
                </div>
              </button>

              <button
                id="btn-play-setup"
                onClick={() => { playClick(); setActiveTab('setup'); }}
                className="group relative flex items-center gap-4 w-full px-5 py-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-slate-200 font-sans rounded-xl transition duration-300 transform active:scale-98 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                <div className="p-2 bg-slate-950/40 rounded-lg text-cyan-400 group-hover:text-cyan-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm tracking-widest uppercase">CUSTOM ARENA SETUP</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5 font-mono uppercase">CHOOSE GAME MODE, SPEED, AND SKINS</span>
                </div>
              </button>

              <button
                id="btn-open-editor"
                onClick={() => { playClick(); onOpenCustomEditor(); }}
                className="group flex items-center gap-4 w-full px-5 py-3.5 bg-slate-900 hover:bg-slate-850 text-purple-400 border border-purple-500/30 rounded-xl hover:border-purple-400 transition duration-200 shadow-[0_0_10px_rgba(168,85,247,0.1)] cursor-pointer"
              >
                <Edit3 className="w-5 h-5" />
                <div className="text-left">
                  <span className="block font-bold text-sm tracking-wider">CUSTOM BOARD BUILDER</span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {hasCustomObstacles ? 'CUSTOM LAYOUT DOCKED (ACTIVE)' : 'DRAW YOUR OWN MAP WALLES'}
                  </span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-leaderboards"
                  onClick={() => { playClick(); setActiveTab('leaderboard'); }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-slate-900/80 hover:bg-slate-850 text-cyan-400 border border-cyan-500/20 rounded-xl transition duration-200 text-xs font-semibold tracking-wider cursor-pointer"
                >
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>HIGH SCORES</span>
                </button>
                <button
                  id="btn-achievements"
                  onClick={() => { playClick(); setActiveTab('achievements'); }}
                  className="flex items-center justify-between px-4 py-3 bg-slate-900/80 hover:bg-slate-850 text-pink-400 border border-pink-500/20 rounded-xl transition duration-200 text-xs font-semibold tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-pink-400" />
                    <span>MEDALS</span>
                  </div>
                  <span className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-pink-500/20">
                    {activeAchievementCount}/{achievements.length}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-instructions"
                  onClick={() => { playClick(); setActiveTab('instructions'); }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl transition duration-200 text-xs font-semibold tracking-wider cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>HOW TO PLAY</span>
                </button>
                <button
                  id="btn-menu-stats"
                  onClick={() => { playClick(); setActiveTab('stats'); }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl transition duration-200 text-xs font-semibold tracking-wider cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span>STATISTICS</span>
                </button>
              </div>

            </div>

            {/* DYNAMIC SOUND CONTROLLER - Elegant compact controller panel */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 mb-2 tracking-widest uppercase">DYNAMIC SOUND CONTROLLER</span>
              <AudioControls />
            </div>
          </div>
        )}

        {/* 2. GAME SETUP OVERLAY */}
        {activeTab === 'setup' && (
          <div className="flex flex-col gap-5 py-2 overflow-y-auto max-h-[500px]">
            {/* Tab Header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-widest">LAUNCH CONTROL</h3>
              <button
                id="btn-setup-back"
                className="text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 cursor-pointer"
                onClick={() => { playClick(); setActiveTab('main'); }}
              >
                ← BACK
              </button>
            </div>

            {/* Play Mode Segment */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 tracking-wider uppercase">BATTLE PROTOCOL MODE</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'single', name: 'SOLO HUNT', desc: 'Classic single snake run', icon: <User className="w-4 h-4" /> },
                  { id: 'versus_ai', name: 'VS CYBER-BOT', desc: 'Outsmart the AI snake!', icon: <Cpu className="w-4 h-4" /> },
                  { id: 'coop', name: 'CO-OP SQUAD', desc: 'Cooperate with friend (WASD)', icon: <ShieldCheck className="w-4 h-4" /> },
                  { id: 'local_pvp', name: 'GRID DUEL', desc: 'PVP Versus mode (WASD)', icon: <Swords className="w-4 h-4" /> },
                ].map(mode => (
                  <button
                    key={mode.id}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-1 transition cursor-pointer ${
                      gameMode === mode.id
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    onClick={() => { playClick(); setGameMode(mode.id as GameMode); }}
                  >
                    <div className="flex items-center gap-2">
                      {mode.icon}
                      <span className="text-xs uppercase font-bold tracking-wider">{mode.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-sans leading-tight mt-1">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Selection Segment */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 tracking-wider uppercase">NEON SKIN COATING (PLAYER 1)</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SKINS.map(skin => (
                  <button
                    key={skin.type}
                    className={`p-2 rounded-lg border text-xs flex flex-col items-center justify-center gap-2 select-none transition cursor-pointer ${
                      selectedSkin === skin.type
                        ? 'bg-slate-900 border-indigo-400 text-indigo-300 font-bold'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    onClick={() => { playClick(); setSelectedSkin(skin.type); }}
                  >
                    <div
                      className="w-8 h-4 rounded-full shadow-[0_0_12px_var(--glow)] transition-all duration-300"
                      style={{
                        backgroundColor: skin.color,
                        boxShadow: `0 0 10px ${skin.glow}`,
                        backgroundImage: skin.type === 'rainbow' ? 'linear-gradient(to right, #ef4444, #eab308, #10b981, #3b82f6)' : 'none'
                      } as any}
                    />
                    <span className="text-[10px] tracking-wider uppercase">{skin.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Board Selection Grid */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 tracking-wider uppercase">AREMA CONSTRAINTS</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BOARDS.map(bd => (
                  <button
                    key={bd.type}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-20 transition cursor-pointer ${
                      selectedBoard === bd.type
                        ? 'bg-purple-500/10 border-purple-400 text-purple-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    onClick={() => { playClick(); setSelectedBoard(bd.type); }}
                  >
                    <span className="text-xs uppercase font-bold tracking-wider">{bd.name}</span>
                    <span className="text-[9px] text-slate-400 font-sans leading-tight block truncate whitespace-normal max-h-8 overflow-hidden">
                      {bd.description}
                    </span>
                  </button>
                ))}
                {hasCustomObstacles && (
                  <button
                    key="custom_editor_select"
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-20 transition cursor-pointer ${
                      selectedBoard === 'custom' as any
                        ? 'bg-fuchsia-500/10 border-fuchsia-400 text-fuchsia-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-750'
                    }`}
                    onClick={() => { playClick(); setSelectedBoard('custom' as any); }}
                  >
                    <span className="text-xs uppercase font-bold tracking-wider">🛠️ CUSTOM BOARD</span>
                    <span className="text-[9px] text-slate-400 font-sans leading-tight">
                      Use the custom blueprint map you created in the level builder.
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Difficulty Level Segment */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 tracking-wider uppercase font-bold">GAME SPEED SPEED DIFFICULTY</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', name: 'EASY PROTOCOL', speed: 'Slow Speed', detail: 'Extra Power-ups, Minimal Obstacles, 1.0x Pts' },
                  { id: 'medium', name: 'CORE MEDIUM', speed: 'Moderate Speed', detail: 'Balanced Obstacles, 1.5x Pts Multiplier' },
                  { id: 'hard', name: 'INSTANT HARD', speed: 'Fast Reflex Speed', detail: 'High obstacles, Fewer Powerups, 2.22x Pts' },
                ].map(diff => (
                  <button
                    key={diff.id}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center gap-1 transition cursor-pointer ${
                      selectedDifficulty === diff.id
                        ? 'bg-rose-500/10 border-rose-400 text-rose-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    onClick={() => { playClick(); setSelectedDifficulty(diff.id as Difficulty); }}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{diff.name}</span>
                    <span className="text-[10px] text-amber-300 font-mono italic">{diff.speed}</span>
                    <span className="text-[9px] text-slate-400 font-sans leading-tight">{diff.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch CTA */}
            <div className="flex gap-4 items-center justify-center mt-3 pt-3 border-t border-slate-900">
              <button
                id="btn-play-launch"
                onClick={startNewGame}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold tracking-widest rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all transform active:scale-98 text-sm cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-930" /> START NEON BATTLE
              </button>
            </div>
          </div>
        )}

        {/* 3. HIGH SCORES LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-widest">CYBER HALL OF FAME</h3>
              <button
                id="btn-leaderboard-back"
                className="text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 cursor-pointer"
                onClick={() => { playClick(); setActiveTab('main'); }}
              >
                ← BACK
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-10 font-mono text-slate-500 text-xs">
                NO CORDS PLOTTED YET. GET OUT THERE AND LOG A HIGH SCORE!
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-905 rounded-xl bg-slate-950/80">
                <table className="w-full text-left font-mono text-xs text-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-cyan-400 font-bold uppercase">
                      <th className="p-3 text-center w-12">RANK</th>
                      <th className="p-3">AVATAR IDENTITY</th>
                      <th className="p-3 text-center">DIFFICULTY</th>
                      <th className="p-3 text-center">BOARD</th>
                      <th className="p-3 text-right">SCORE MARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => {
                      let rankStyle = "text-slate-400";
                      if (index === 0) rankStyle = "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] font-bold text-sm";
                      else if (index === 1) rankStyle = "text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)] font-bold";
                      else if (index === 2) rankStyle = "text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.3)] font-bold";

                      return (
                        <tr key={index} className="border-b border-slate-900/60 hover:bg-slate-900/25 transition">
                          <td className={`p-3 text-center ${rankStyle}`}>{index + 1}</td>
                          <td className="p-3 font-semibold text-slate-100">{entry.name}</td>
                          <td className="p-3 text-center capitalize">{entry.difficulty}</td>
                          <td className="p-3 text-center capitalize">{entry.board}</td>
                          <td className="p-3 text-right font-extrabold text-cyan-400 font-mono tracking-wider">{entry.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-lg font-bold text-pink-400 uppercase tracking-widest">ARCADE MEDALS ({activeAchievementCount}/{achievements.length})</h3>
              <button
                id="btn-achievements-back"
                className="text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 cursor-pointer"
                onClick={() => { playClick(); setActiveTab('main'); }}
              >
                ← BACK
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {achievements.map(ach => (
                <div
                  key={ach.id}
                  className={`flex gap-4 p-3.5 rounded-xl border transition duration-200 ${
                    ach.unlocked
                      ? 'bg-pink-950/15 border-pink-500/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                      : 'bg-slate-900/40 border-slate-900 grayscale opacity-45'
                  }`}
                >
                  <div className={`text-3xl flex items-center justify-center w-12 h-12 rounded-lg ${ach.unlocked ? 'bg-pink-500/10 drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'bg-slate-800'}`}>
                    {ach.icon}
                  </div>
                  <div className="flex-1 flex flex-col justify-center text-left">
                    <span className={`text-xs uppercase tracking-wider font-extrabold ${ach.unlocked ? 'text-pink-300' : 'text-slate-400'}`}>
                      {ach.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">{ach.description}</span>
                    
                    {/* Optional Achievement Progress bar */}
                    {ach.progressMax !== undefined && ach.progressCurrent !== undefined && (
                      <div className="mt-2 text-left">
                        <div className="w-full bg-slate-800 rounded-full h-1 relative overflow-hidden">
                          <div
                            className="bg-pink-500 h-1 rounded-full text-left"
                            style={{ width: `${Math.min(100, (ach.progressCurrent / ach.progressMax) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono mt-1 text-slate-500">
                          <span>PROGRESS:</span>
                          <span>{ach.progressCurrent} / {ach.progressMax}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. INSTRUCTIONS */}
        {activeTab === 'instructions' && (
          <div className="flex flex-col gap-4 py-2 text-left text-sm text-slate-300 leading-relaxed font-sans overflow-y-auto max-h-[380px] pr-1">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2">
              <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest font-mono">PILOT TRAINING CODES</h3>
              <button
                id="btn-instructions-back"
                className="text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 cursor-pointer"
                onClick={() => { playClick(); setActiveTab('main'); }}
              >
                ← BACK
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <h4 className="text-cyan-400 font-bold uppercase tracking-wider mb-1 font-mono text-xs">CORE PRINCIPLES</h4>
                <p>Navigate your glowing cybernetic snake across the arena. Consume dynamic fruit items to score points and expand your mainframe size. Hitting obstacles or your own body triggers immediate system collapse. Passing through the outer grid frame seamlessly teleports you to the opposite side!</p>
              </div>

              <div>
                <h4 className="text-amber-400 font-bold uppercase tracking-wider mb-1.5 font-mono text-xs">CYBERNETIC CONTROLS</h4>
                <table className="w-full text-left border border-slate-900 rounded font-mono text-[11px] bg-slate-950/80">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-2">INPUT KEYPUNCH</th>
                      <th className="p-2">ACTION REGISTERED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900/50"><td className="p-2 text-cyan-300">↑ / ↓ / ← / →</td><td className="p-2">Steer Snake Directions (Player 1)</td></tr>
                    <tr className="border-b border-slate-900/50"><td className="p-2 text-cyan-300">W / A / S / D</td><td className="p-2">Steer Snake Directions (Player 2 - Co-Op/PvP)</td></tr>
                    <tr className="border-b border-slate-900/50"><td className="p-2 text-cyan-300">SPACEBAR</td><td className="p-2">Trigger Quick-Pause Matrix</td></tr>
                    <tr className="border-b border-slate-900/50"><td className="p-2 text-cyan-300">R</td><td className="p-2">Instant Session Reset</td></tr>
                    <tr className="border-b border-slate-900/50"><td className="p-2 text-cyan-300">M</td><td className="p-2">Mute / Unmute Cyber Sync Synth Wave</td></tr>
                    <tr><td className="p-2 text-cyan-300">ESC</td><td className="p-2">Abandon Arena to Main Lobby</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-purple-400 font-bold uppercase tracking-wider mb-1.5 font-mono text-xs">FRUIT MATRIX ENCODING</h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  {FRUIT_PACK.map(f => (
                    <div key={f.name} className="flex items-center gap-2 bg-slate-900/40 p-1.5 border border-slate-800 rounded">
                      <span className="text-lg">{f.symbol}</span>
                      <div>
                        <span className="font-bold uppercase text-slate-200">{f.name}</span>
                        <span className="text-cyan-400 block font-bold">+{f.points} PTS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-pink-400 font-bold uppercase tracking-wider mb-1.5 font-mono text-xs">SPECIAL POWER-UP PLOTS</h4>
                <div className="space-y-2">
                  {[
                    { sym: '⭐', name: 'Speed Boost Star', desc: 'Accelerates speed temporary. Fast scores!' },
                    { sym: '❄️', name: 'Slow Motion Crystal', desc: 'Bravely cools velocity, providing precise focus.' },
                    { sym: '💎', name: 'Double Score Gem', desc: 'Sets all score items to 2x multipliers for 10 seconds!' },
                    { sym: '🛡️', name: 'Shield Orb', desc: 'Blocks and nullifies one obstacle or body collision.' },
                    { sym: '👻', name: 'Ghost Orb', desc: 'Walk seamlessly through internal obstacles without harm!' },
                    { sym: '💊', name: 'Growth Capsule', desc: 'Gains 3 extra size blocks but massive immediate score.' },
                    { sym: '🧪', name: 'Shrink Capsule', desc: 'Nips off 3 tail segments. Perfect for highly congested grids.' },
                    { sym: '🧲', name: 'Magnet Orb', desc: 'Pulls nearby edible food straight to your head.' },
                  ].map(pu => (
                    <div key={pu.name} className="flex gap-3 bg-slate-900/50 p-2 border border-slate-800 rounded-lg text-left">
                      <span className="text-2xl flex items-center justify-center shrink-0">{pu.sym}</span>
                      <div>
                        <span className="block font-bold text-pink-300 text-[11px] uppercase">{pu.name}</span>
                        <span className="block text-[10px] text-slate-400 leading-normal">{pu.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. STATISTICS PANEL */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-4 py-2 font-mono">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-widest">SYSTEM STATISTICS ENGINE</h3>
              <button
                id="btn-stats-back"
                className="text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 cursor-pointer"
                onClick={() => { playClick(); setActiveTab('main'); }}
              >
                ← BACK
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-h-[350px] overflow-y-auto">
              {[
                { title: 'TOTAL GAMES LAUNCHED', value: stats.totalGames, detail: 'Cumulative arcade runs' },
                { title: 'PEAK MATRIX SCORE', value: stats.highestScore, detail: 'Absolute personal high score' },
                { title: 'CYBER FRUITS HARVESTED', value: stats.totalFoodCollected, detail: 'Quantity eaten during session history' },
                { title: 'LONGEST SNAKE DETECTED', value: `${stats.longestSnakeLength} slots`, detail: 'Max tail segments reached' },
                { title: 'SURVIVAL LOG TIME', value: `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`, detail: 'Total active play time' },
                { title: 'AVERAGE RATIO SCORE', value: stats.totalGames === 0 ? '0' : Math.round(stats.totalFoodCollected * 15 / stats.totalGames), detail: 'Average score yield' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] text-slate-500 tracking-wider font-bold mb-1 uppercase">{stat.title}</span>
                  <span className="text-2xl font-extrabold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]">{stat.value}</span>
                  <span className="text-[10px] text-slate-400 font-sans mt-1">{stat.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACCIDENT PREVENTER (Literal, tidy, human layout label) */}
      <footer className="w-full text-center mt-6 text-[10px] text-slate-500 font-mono tracking-wider border-t border-slate-900 pt-4 pb-1 flex justify-between px-2">
        <span className="text-cyan-500/80 font-semibold">DEVELOPED BY MUHAMMAD IDREES</span>
        <span>© 2026 PANAVERSITY</span>
      </footer>

    </div>
  );
}
