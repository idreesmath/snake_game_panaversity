import React, { useState, useEffect } from 'react';
import { LayoutGrid, Trash2, ShieldAlert, Play, ArrowLeft } from 'lucide-react';
import { audio } from '../utils/audio';
import { Point } from '../types';

interface CustomBoardEditorProps {
  width: number;
  height: number;
  onSave: (obstacles: Point[]) => void;
  onCancel: () => void;
  initialObstacles?: Point[];
}

export default function CustomBoardEditor({
  width = 20,
  height = 20,
  onSave,
  onCancel,
  initialObstacles = [],
}: CustomBoardEditorProps) {
  const [grid, setGrid] = useState<boolean[][]>(() => {
    const freshGrid = Array(height).fill(null).map(() => Array(width).fill(false));
    initialObstacles.forEach(pt => {
      if (pt.y >= 0 && pt.y < height && pt.x >= 0 && pt.x < width) {
        freshGrid[pt.y][pt.x] = true;
      }
    });
    return freshGrid;
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<boolean>(true); // true to draw, false to erase

  const handleCellMouseDown = (row: number, col: number) => {
    // Prevent drawing on outer boundaries if they are protected, but here let's allow,
    // though let's keep snake starting positions (e.g., center cells) free of obstacles.
    if ((col >= 2 && col <= 8) && row === Math.floor(height / 2)) {
      // Avoid blocking starting horizontal snake path
      return;
    }

    audio.playClick();
    const nextVal = !grid[row][col];
    setDrawMode(nextVal);
    setIsDrawing(true);

    const newGrid = [...grid.map(r => [...r])];
    newGrid[row][col] = nextVal;
    setGrid(newGrid);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isDrawing) return;
    if ((col >= 2 && col <= 8) && row === Math.floor(height / 2)) {
      return;
    }

    const newGrid = [...grid.map(r => [...r])];
    if (newGrid[row][col] !== drawMode) {
      newGrid[row][col] = drawMode;
      setGrid(newGrid);
      // Small clicking sound
      if (Math.random() < 0.25) {
        audio.playClick();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const clearGrid = () => {
    audio.playCollision();
    setGrid(Array(height).fill(null).map(() => Array(width).fill(false)));
  };

  const saveBoard = () => {
    audio.playLevelUp();
    const obstacles: Point[] = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c]) {
          obstacles.push({ x: c, y: r });
        }
      }
    }
    onSave(obstacles);
  };

  return (
    <div id="board-editor-panel" className="flex flex-col items-center justify-center p-6 bg-slate-950/95 text-slate-100 border border-purple-500/30 rounded-2xl max-w-4xl w-full mx-auto shadow-[0_0_50px_rgba(168,85,247,0.15)] select-none">
      <div className="w-full flex items-center justify-between mb-6">
        <button
          id="btn-editor-back"
          onClick={() => { audio.playClick(); onCancel(); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-purple-400 border border-purple-500/20 rounded-xl transition duration-200 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            NEON LEVEL BUILDER
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">CREATE CUSTOM OBSTACLE LAYOUTS</p>
        </div>
        <div className="w-24"></div> {/* Spacer for symmetry */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Help & Info Column */}
        <div className="flex flex-col gap-4 bg-slate-900/60 p-4 border border-purple-500/10 rounded-xl">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <LayoutGrid className="w-4 h-4" />
            <span>HOW TO BUILD</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-sans leading-relaxed">
            <li>Click and drag on the grid cells to draw neon barrier blocks.</li>
            <li>Click on active obstacles to erase them.</li>
            <li>The center horizontals (columns 2-8, middle row) are protected to guarantee a safe snake spawning spot.</li>
            <li>These obstacles will collide with the snake if hit, so design responsibly!</li>
          </ul>

          <div className="mt-2 p-3 bg-red-950/30 border border-red-500/20 rounded-lg flex gap-2 items-start text-xs text-red-300">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>Avoid completely boxing in critical sections, otherwise food spawns might become unreachable!</span>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <button
              id="btn-editor-clear"
              onClick={clearGrid}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl transition duration-200 text-xs font-semibold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear Canvas
            </button>
            <button
              id="btn-editor-save"
              onClick={saveBoard}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition duration-200 text-xs cursor-pointer"
            >
              <Play className="w-4 h-4" /> Save & Use Board
            </button>
          </div>
        </div>

        {/* Builder Board Column */}
        <div className="md:col-span-2 flex flex-col items-center justify-center bg-slate-950 p-4 border border-purple-500/20 rounded-xl relative overflow-hidden">
          {/* Subtle grid background shine */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(-45deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          <div
            id="editor-grids-wrapper"
            className="grid gap-px bg-slate-900 border border-purple-500/40 p-2 rounded-lg cursor-crosshair max-w-full overflow-auto shadow-[0_0_30px_rgba(168,85,247,0.08)]"
            style={{
              gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
              width: `${Math.min(width * 18, 400)}px`,
              aspectRatio: `${width}/${height}`,
            }}
          >
            {grid.map((rowArr, rIdx) =>
              rowArr.map((isActive, cIdx) => {
                const isSpawnProtected = (cIdx >= 2 && cIdx <= 8) && rIdx === Math.floor(height / 2);
                let bgClass = 'bg-slate-950/80';
                let style = {};

                if (isActive) {
                  bgClass = 'bg-purple-500 shadow-[inset_0_0_6px_rgba(255,255,255,0.7),0_0_12px_rgba(168,85,247,0.8)]';
                } else if (isSpawnProtected) {
                  bgClass = 'bg-cyan-950/20 border border-cyan-500/10';
                }

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                    className={`aspect-square rounded-[2px] transition-all duration-150 ${bgClass}`}
                    style={style}
                    title={isSpawnProtected ? "Snake Spawn Safe-Zone" : `X: ${cIdx}, Y: ${rIdx}`}
                  />
                );
              })
            )}
          </div>

          <div className="w-full flex justify-between px-2 mt-3 font-mono text-[10px] text-slate-400">
            <span>Dimensions: {width} x {height}</span>
            <span>Spawn Zone (Blue indicator) protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
