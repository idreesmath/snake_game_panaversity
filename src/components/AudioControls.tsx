import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audio } from '../utils/audio';

export default function AudioControls() {
  const [muted, setMuted] = useState(audio.getMuteState());
  const [volume, setVolume] = useState(audio.getVolume());

  useEffect(() => {
    // Keep volume in sync
    audio.setVolume(volume);
  }, [volume]);

  const handleMuteToggle = () => {
    const isMuted = audio.toggleMute();
    setMuted(isMuted);
    audio.playClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audio.setVolume(newVol);
    if (muted && newVol > 0) {
      audio.toggleMute();
      setMuted(false);
    }
  };

  return (
    <div id="audio-settings" className="flex items-center gap-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl px-4 py-2 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
      <button
        id="btn-toggle-mute"
        onClick={handleMuteToggle}
        className="text-cyan-400 hover:text-cyan-300 focus:outline-none transition-colors duration-200 cursor-pointer"
        title="Toggle Sound"
      >
        {muted || volume === 0 ? (
          <VolumeX className="w-5 h-5 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] text-rose-500" />
        ) : (
          <Volume2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
        )}
      </button>
      <input
        id="audio-volume-range"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={handleVolumeChange}
        className="w-20 md:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
      />
      <span className="font-mono text-xs text-cyan-400 hidden sm:inline" style={{ width: '28px', textAlign: 'right' }}>
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
