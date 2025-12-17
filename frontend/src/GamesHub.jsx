import { useState, useEffect } from 'react';
import { X, RotateCcw, Trophy, Brain, Grid3x3, Search as SearchIcon } from 'lucide-react';

function GamesHub({ onClose }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [score, setScore] = useState(0);
  
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  
  const [sudokuGrid, setSudokuGrid] = useState([]);
  const [sudokuSolution, setSudokuSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [sudokuErrors, setSudokuErrors] = useState([]);
  
  const [wordSearchGrid, setWordSearchGrid] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [level, setLevel] = useState(1);
  
  // Snake Game
  const [snake, setSnake] = useState([[5, 5]]);
  const [food, setFood] = useState([10, 10]);
  const [direction, setDirection] = useState('RIGHT');
  const [snakeGameOver, setSnakeGameOver] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeGameStarted, setSnakeGameStarted] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  const motivationalQuotes = [
    "Every setback is a setup for a comeback! Keep trying! 💪",
    "Just like this game, life requires patience and strategy! 🎯",
    "You're learning and growing with each attempt! 🌟",
    "Progress over perfection - you're doing great! 🌈",
    "Stay focused and keep moving forward! 🚀",
    "Every game is a chance to improve! 💙",
    "Challenges make us stronger! Keep going! ✨",
    "Your persistence is your power! 🎨",
    "One step at a time - you've got this! 🌸",
    "Balance and focus - skills for life and games! 🧘"
  ];

  const games = [
    { id: 'memory', name: 'Memory Match', icon: Brain, color: 'from-purple-500 to-pink-500' },
    { id: 'sudoku', name: 'Sudoku', icon: Grid3x3, color: 'from-green-500 to-emerald-600' },
    { id: 'wordsearch', name: 'Word Search', icon: SearchIcon, color: 'from-blue-500 to-cyan-500' },
    { id: 'snake', name: 'Snake Game', icon: Trophy, color: 'from-green-600 to-teal-500' }
  ];

  // Memory Match
  const startMemoryGame = () => {
    const emojis = ['😊', '🌟', '💙', '🌈', '🎯', '🎨'];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5).map((emoji, idx) => ({ id: idx, emoji }));
    setMemoryCards(cards);
    setFlippedCards([]);
    setMatchedCards([]);
    setScore(0);
    setMoves(0);
  };

  const handleCardClick = (cardId) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedCards.includes(cardId)) return;
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const card1 = memoryCards.find(c => c.id === newFlipped[0]);
      const card2 = memoryCards.find(c => c.id === newFlipped[1]);
      if (card1.emoji === card2.emoji) {
        setMatchedCards([...matchedCards, ...newFlipped]);
        setScore(score + 10);
        setFlippedCards([]);
        if (matchedCards.length + 2 === memoryCards.length) {
          setTimeout(() => alert(`🎉 Perfect! Score: ${score + 10}, Moves: ${moves + 1}`), 500);
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  // Sudoku
  const sudokuPuzzles = [
    { puzzle: [[1,0,0,4],[0,4,1,0],[4,0,2,0],[0,2,0,1]], solution: [[1,3,2,4],[2,4,1,3],[4,1,2,3],[3,2,4,1]] },
    { puzzle: [[0,2,3,0],[3,0,0,2],[0,3,0,1],[0,1,2,0]], solution: [[1,2,3,4],[3,4,1,2],[2,3,4,1],[4,1,2,3]] },
    { puzzle: [[0,1,0,3],[0,3,2,0],[3,0,1,0],[1,0,3,0]], solution: [[2,1,4,3],[4,3,2,1],[3,2,1,4],[1,4,3,2]] }
  ];

  const startSudoku = () => {
    const random = sudokuPuzzles[Math.floor(Math.random() * sudokuPuzzles.length)];
    setSudokuGrid(JSON.parse(JSON.stringify(random.puzzle)));
    setSudokuSolution(random.solution);
    setSelectedCell(null);
    setSudokuErrors([]);
    setScore(0);
  };

  const handleSudokuInput = (row, col, value) => {
    const initialPuzzle = sudokuPuzzles.find(p => JSON.stringify(p.solution) === JSON.stringify(sudokuSolution))?.puzzle;
    if (initialPuzzle && initialPuzzle[row][col] !== 0) return;
    const newGrid = [...sudokuGrid.map(r => [...r])];
    newGrid[row][col] = value;
    setSudokuGrid(newGrid);
    if (value === sudokuSolution[row][col]) {
      setScore(score + 5);
      let isComplete = newGrid.every((row, i) => row.every((cell, j) => cell === sudokuSolution[i][j]));
      if (isComplete) setTimeout(() => alert(`🎉 Puzzle Solved! Score: ${score + 5}`), 300);
    } else if (value !== 0) {
      setSudokuErrors([...sudokuErrors, `${row}-${col}`]);
      setTimeout(() => setSudokuErrors(sudokuErrors.filter(e => e !== `${row}-${col}`)), 1000);
    }
  };

  // Word Search
  const wordSets = [
    { level: 1, words: ['CALM', 'HOPE', 'PEACE', 'JOY', 'SMILE', 'TRUST'] },
    { level: 2, words: ['HAPPY', 'RELAX', 'BREATHE', 'FOCUS', 'SLEEP', 'MINDFUL'] },
    { level: 3, words: ['GRATEFUL', 'POSITIVE', 'STRONG', 'COURAGE', 'BALANCE', 'HEALING'] }
  ];

  const generateWordSearch = (words) => {
    const size = 8;
    const grid = Array(size).fill().map(() => Array(size).fill(''));
    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const direction = Math.floor(Math.random() * 3);
        let row = Math.floor(Math.random() * size);
        let col = Math.floor(Math.random() * size);
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const newRow = row + (direction === 1 || direction === 2 ? i : 0);
          const newCol = col + (direction === 0 || direction === 2 ? i : 0);
          if (newRow >= size || newCol >= size || (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i])) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const newRow = row + (direction === 1 || direction === 2 ? i : 0);
            const newCol = col + (direction === 0 || direction === 2 ? i : 0);
            grid[newRow][newCol] = word[i];
          }
          placed = true;
        }
        attempts++;
      }
    });
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] === '') grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    return grid;
  };

  const startWordSearch = (lvl = level) => {
    const wordSet = wordSets[lvl - 1];
    setWordsToFind(wordSet.words);
    setWordSearchGrid(generateWordSearch(wordSet.words));
    setFoundWords([]);
    setSelectedCells([]);
    setScore(0);
    setLevel(lvl);
  };

  const handleCellClick = (row, col) => {
    const cellKey = `${row}-${col}`;
    if (foundWords.some(word => word.cells.includes(cellKey))) return;
    setSelectedCells(prev => prev.includes(cellKey) ? prev.filter(c => c !== cellKey) : [...prev, cellKey]);
  };

  const checkWord = () => {
    if (selectedCells.length < 3) return;
    const word = selectedCells.map(cell => {
      const [row, col] = cell.split('-').map(Number);
      return wordSearchGrid[row][col];
    }).join('');
    if (wordsToFind.includes(word)) {
      setFoundWords([...foundWords, { word, cells: selectedCells }]);
      setScore(score + word.length * 5);
      setSelectedCells([]);
      if (foundWords.length + 1 === wordsToFind.length) {
        setTimeout(() => alert(`🎉 Level ${level} Complete! Score: ${score + word.length * 5}`), 300);
      }
    } else {
      setSelectedCells([]);
    }
  };

  // Snake Game
  const startSnakeGame = () => {
    setSnake([[5, 5]]);
    setFood([Math.floor(Math.random() * 15), Math.floor(Math.random() * 15)]);
    setDirection('RIGHT');
    setSnakeScore(0);
    setSnakeGameOver(false);
    setSnakeGameStarted(false);
    setShowQuote(false);
  };

  useEffect(() => {
    if (selectedGame !== 'snake' || !snakeGameStarted || snakeGameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = [...prevSnake[0]];
        
        if (direction === 'UP') head[0] -= 1;
        if (direction === 'DOWN') head[0] += 1;
        if (direction === 'LEFT') head[1] -= 1;
        if (direction === 'RIGHT') head[1] += 1;

        // Check wall collision
        if (head[0] < 0 || head[0] >= 15 || head[1] < 0 || head[1] >= 15) {
          setSnakeGameOver(true);
          setSnakeGameStarted(false);
          setShowQuote(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment[0] === head[0] && segment[1] === head[1])) {
          setSnakeGameOver(true);
          setSnakeGameStarted(false);
          setShowQuote(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head[0] === food[0] && head[1] === food[1]) {
          setSnakeScore(s => s + 10);
          setFood([Math.floor(Math.random() * 15), Math.floor(Math.random() * 15)]);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [selectedGame, snakeGameStarted, snakeGameOver, direction, food]);

  useEffect(() => {
    if (selectedGame !== 'snake' || snakeGameOver) return;

    const handleKeyPress = (e) => {
      if (!snakeGameStarted) {
        setSnakeGameStarted(true);
      }

      if (e.key === 'ArrowUp' && direction !== 'DOWN') setDirection('UP');
      else if (e.key === 'ArrowDown' && direction !== 'UP') setDirection('DOWN');
      else if (e.key === 'ArrowLeft' && direction !== 'RIGHT') setDirection('LEFT');
      else if (e.key === 'ArrowRight' && direction !== 'LEFT') setDirection('RIGHT');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedGame, direction, snakeGameStarted, snakeGameOver]);

  const handleSnakeControl = (dir) => {
    if (!snakeGameStarted) {
      setSnakeGameStarted(true);
    }
    if (dir === 'UP' && direction !== 'DOWN') setDirection('UP');
    else if (dir === 'DOWN' && direction !== 'UP') setDirection('DOWN');
    else if (dir === 'LEFT' && direction !== 'RIGHT') setDirection('LEFT');
    else if (dir === 'RIGHT' && direction !== 'LEFT') setDirection('RIGHT');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#16181f] rounded-xl p-5 w-full max-w-3xl border-2 border-gray-400 dark:border-gray-600 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎮 Relaxation Games</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition"><X className="w-5 h-5" /></button>
        </div>

        {!selectedGame ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {games.map((game) => (
              <button key={game.id} onClick={() => {
                setSelectedGame(game.id);
                setScore(0);
                if (game.id === 'memory') startMemoryGame();
                if (game.id === 'sudoku') startSudoku();
                if (game.id === 'wordsearch') startWordSearch();
                if (game.id === 'snake') startSnakeGame();
              }} className={`p-5 rounded-xl bg-gradient-to-br ${game.color} text-white hover:scale-105 transition-all duration-300 shadow-lg`}>
                <game.icon className="w-10 h-10 mx-auto mb-2" />
                <div className="font-bold text-sm">{game.name}</div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              <button onClick={() => setSelectedGame(null)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition text-sm font-medium">← Back</button>
              <div className="text-lg font-bold">Score: <span className="text-blue-600">{score || snakeScore}</span></div>
            </div>

            {selectedGame === 'memory' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={startMemoryGame} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> New Game</button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Moves: {moves}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                  {memoryCards.map((card) => (
                    <button key={card.id} onClick={() => handleCardClick(card.id)} className={`aspect-square rounded-lg text-3xl transition-all ${flippedCards.includes(card.id) || matchedCards.includes(card.id) ? 'bg-white dark:bg-gray-800 border-2 border-purple-500' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-105'} ${matchedCards.includes(card.id) ? 'opacity-50' : ''}`}>
                      {(flippedCards.includes(card.id) || matchedCards.includes(card.id)) ? card.emoji : '?'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedGame === 'sudoku' && (
              <div className="space-y-4">
                <button onClick={startSudoku} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> New Puzzle</button>
                <div className="max-w-sm mx-auto">
                  <div className="grid grid-cols-4 gap-1.5 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    {sudokuGrid.map((row, i) => row.map((cell, j) => {
                      const initialPuzzle = sudokuPuzzles.find(p => JSON.stringify(p.solution) === JSON.stringify(sudokuSolution))?.puzzle;
                      const isFixed = initialPuzzle && initialPuzzle[i][j] !== 0;
                      return (
                        <div key={`${i}-${j}`} onClick={() => !isFixed && setSelectedCell(`${i}-${j}`)} className={`aspect-square flex items-center justify-center text-xl font-bold rounded transition cursor-pointer ${isFixed ? 'bg-gray-300 dark:bg-gray-700' : cell === 0 ? 'bg-white dark:bg-gray-900 hover:bg-blue-50' : sudokuErrors.includes(`${i}-${j}`) ? 'bg-red-100 text-red-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                          {cell !== 0 && cell}
                        </div>
                      );
                    }))}
                  </div>
                  {selectedCell && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {[1, 2, 3, 4, 0].map(num => (
                        <button key={num} onClick={() => { const [row, col] = selectedCell.split('-').map(Number); handleSudokuInput(row, col, num); if (num !== 0) setSelectedCell(null); }} className={`py-2 rounded-lg font-bold transition text-sm ${num === 0 ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                          {num === 0 ? 'X' : num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedGame === 'wordsearch' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button onClick={() => startWordSearch()} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> New Game</button>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(lvl => (
                      <button key={lvl} onClick={() => startWordSearch(lvl)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${level === lvl ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Level {lvl}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="grid grid-cols-8 gap-0.5 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                      {wordSearchGrid.map((row, i) => row.map((letter, j) => {
                        const cellKey = `${i}-${j}`;
                        const isFound = foundWords.some(word => word.cells.includes(cellKey));
                        const isSelected = selectedCells.includes(cellKey);
                        return (
                          <button key={cellKey} onClick={() => handleCellClick(i, j)} className={`aspect-square flex items-center justify-center text-xs font-bold rounded transition ${isFound ? 'bg-green-400 text-white' : isSelected ? 'bg-blue-400 text-white' : 'bg-white dark:bg-gray-900 hover:bg-blue-100'}`}>{letter}</button>
                        );
                      }))}
                    </div>
                    <button onClick={checkWord} disabled={selectedCells.length < 3} className="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-semibold">Check Word</button>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2">Find these words:</h3>
                    <div className="space-y-1">
                      {wordsToFind.map(word => (
                        <div key={word} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${foundWords.some(w => w.word === word) ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through' : 'bg-gray-100 dark:bg-gray-800'}`}>{word}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedGame === 'snake' && (
              <div className="space-y-4 max-w-lg mx-auto">
                <button onClick={startSnakeGame} className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-lg hover:shadow-lg transition text-sm flex items-center gap-2 mx-auto"><RotateCcw className="w-4 h-4" /> New Game</button>

                <div className="relative">
                  <div className="grid grid-cols-15 gap-0.5 bg-gray-800 p-2 rounded-xl" style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)' }}>
                    {Array(15).fill().map((_, row) => 
                      Array(15).fill().map((_, col) => {
                        const isSnake = snake.some(s => s[0] === row && s[1] === col);
                        const isHead = snake[0] && snake[0][0] === row && snake[0][1] === col;
                        const isFood = food[0] === row && food[1] === col;
                        return (
                          <div
                            key={`${row}-${col}`}
                            className={`aspect-square rounded-sm ${
                              isFood ? 'bg-red-500' :
                              isHead ? 'bg-green-400' :
                              isSnake ? 'bg-green-600' :
                              'bg-gray-700'
                            }`}
                          />
                        );
                      })
                    )}
                  </div>

                  {(!snakeGameStarted || snakeGameOver) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
                      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="text-2xl font-bold mb-3">{snakeGameOver ? '🎮 Game Over!' : '🐍 Snake Game'}</div>
                        {snakeGameOver && (
                          <>
                            <div className="text-xl font-bold mb-3">Score: {snakeScore}</div>
                            {showQuote && (
                              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm italic text-gray-700 dark:text-gray-300">
                                {motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]}
                              </div>
                            )}
                          </>
                        )}
                        {!snakeGameOver && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Use arrow keys or buttons to play
                          </div>
                        )}
                        <button onClick={startSnakeGame} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">
                          {snakeGameOver ? 'Play Again' : 'Start Game'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div></div>
                  <button onClick={() => handleSnakeControl('UP')} className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">↑</button>
                  <div></div>
                  <button onClick={() => handleSnakeControl('LEFT')} className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">←</button>
                  <button onClick={() => handleSnakeControl('DOWN')} className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">↓</button>
                  <button onClick={() => handleSnakeControl('RIGHT')} className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">→</button>
                </div>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Eat the red food to grow! Avoid walls and yourself!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GamesHub;
