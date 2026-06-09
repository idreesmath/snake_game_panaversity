import React from 'react';
import { RotateCcw, Home, Award, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { Difficulty, BoardType, GameMode } from '../types';
import { audio } from '../utils/audio';

interface GameOverMenuProps {
  p1Score: number;
  p2Score: number;
  difficulty: Difficulty;
  boardType: BoardType;
  gameMode: GameMode;
  onRestart: () => void;
  onExit: () => void;
  isNewHighScore: boolean;
}

export default function GameOverMenu({
  p1Score,
  p2Score,
  difficulty,
  boardType,
  gameMode,
  onRestart,
  onExit,
  isNewHighScore,
}: GameOverMenuProps) {

  const playClick = () => {
    audio.playClick();
  };

  const getWinnerMessage = () => {
    if (gameMode === 'local_pvp') {
      if (p1Score > p2Score) return { title: 'PLAYER 1 VICTORY!', desc: 'P1 dominated the grid duel.', color: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' };
      if (p2Score > p1Score) return { title: 'PLAYER 2 VICTORY!', desc: 'P2 dominated the grid duel.', color: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' };
      return { title: 'DRAW DUEL!', desc: 'Equal performance markers.', color: 'text-purple-400' };
    } else if (gameMode === 'versus_ai') {
      if (p1Score > p2Score) return { title: 'CYBER-BOT DESTROYED!', desc: 'User outsmarted the CPU AI snake.', color: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]' };
      if (p2Score > p1Score) return { title: 'NEURAL BOT DOMINATION!', desc: 'Machine pathfinder conquered.', color: 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]' };
      return { title: 'TIGHT TIE!', desc: 'Perfect matching speed.', color: 'text-amber-400' };
    } else if (gameMode === 'coop') {
      return { title: 'COOPERATION TERM OVER', desc: `Total Combined Score: ${p1Score + p2Score}`, color: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' };
    } else {
      return { title: 'GRID DISRUPT: SYSTEM DOWN', desc: 'Snake crashed. Connection lost.', color: 'text-rose-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]' };
    }
  };

  const winDetails = getWinnerMessage();

  return (
    <div id="game-over-panel" className="flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 border border-rose-500/30 rounded-2xl max-w-md w-full mx-auto shadow-[0_0_55px_rgba(244,63,94,0.18)] select-none">
      
      {/* Alert Header Icon */}
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse">
        <AlertCircle className="w-8 h-8" />
      </div>

      {isNewHighScore && (
        <div className="mb-4 animate-bounce flex items-center gap-1.5 px-3 py-1 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 font-mono text-xs rounded-full">
          <Sparkles className="w-4 h-4 text-yellow-400" /> NEW RECORD LANDED!
        </div>
      )}

      <h2 className={`text-2xl font-black tracking-widest text-center uppercase ${winDetails.color}`}>
        {winDetails.title}
      </h2>
      <p className="text-xs text-slate-400 font-sans tracking-wide text-center mt-1">
        {winDetails.desc}
      </p>

      {/* Score Summary Box */}
      <div className="w-full bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 my-5 font-mono text-xs space-y-3">
        <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
          <span>RUN PARAMETERS:</span>
          <span className="text-slate-200 capitalize font-bold">{difficulty} ({boardType})</span>
        </div>

        {gameMode === 'single' ? (
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">FINAL MARK SCORE:</span>
            <span className="text-2xl font-black text-rose-400 tracking-wider font-mono">{p1Score} PTS</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">PLAYER 1 SCORE:</span>
              <span className="text-base font-bold text-emerald-400">{p1Score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">P2 / CYBER-BOT:</span>
              <span className="text-base font-bold text-cyan-400">{p2Score}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Row */}
      <div className="flex flex-col gap-2.5 w-full">
        <button
          id="btn-gameover-replay"
          onClick={() => { playClick(); onRestart(); }}
          className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.55)] transition-all transform active:scale-98 text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> PLAY AGAIN
        </button>

        <button
          id="btn-gameover-lobby"
          onClick={() => { playClick(); onExit(); }}
          className="w-full py-3 bg-slate-905 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-300 font-bold rounded-xl transition duration-200 text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Home className="w-4 h-4" /> MAIN LOBBY MENU
        </button>
      </div>

    </div>
  );
}
