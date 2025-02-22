// src/App.js
import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js'; // Named export from chess.js
import Chessboard from './components/Chessboard';
import './index.css';

function App() {
  // Initialize a new chess game.
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [message, setMessage] = useState('');
  // Mode: "human" for human vs. human; "ai" for human vs. computer.
  const [mode, setMode] = useState('ai');
  // AI difficulty: easy (5), medium (10), hard (16).
  const [difficulty, setDifficulty] = useState(5);
  // Flag indicating if it's the computer's turn.
  const [isComputerTurn, setIsComputerTurn] = useState(false);

  // Handler for when a human moves a piece.
  const handleDrop = useCallback((sourceSquare, targetSquare) => {
    try {
      const piece = game.get(sourceSquare);
      if (!piece) {
        setMessage("No piece at the selected square. Please try again.");
        return false;
      }
      // In AI mode, only allow human (White) moves.
      if (mode === 'ai' && piece.color !== 'w') {
        setMessage("It's not your turn. Please wait for the computer move.");
        return false;
      }
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move === null) {
        setMessage("Invalid move. Please try a different move.");
        return false;
      }
      // Clear any previous error messages.
      setMessage('');
      setPosition(game.fen());
      
      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          setMessage("Checkmate! Game over.");
        } else if (game.isDraw()) {
          setMessage("Draw! Game over.");
        } else {
          setMessage("Game over.");
        }
      } else if (mode === 'ai' && game.turn() === 'b') {
        setIsComputerTurn(true);
      }
      return true;
    } catch (error) {
      console.error("Error in handleDrop:", error);
      setMessage("Wrong move selected! Please try again.");
      return false;
    }
  }, [game, mode]);
  
  // Effect to trigger the computer's move by calling the backend API.
  useEffect(() => {
    if (mode === 'ai' && isComputerTurn && game.turn() === 'b' && !game.isGameOver()) {
      // Map numeric difficulty to a string for the backend.
      let difficultyStr = "medium";
      if (difficulty === 5) difficultyStr = "easy";
      else if (difficulty === 10) difficultyStr = "medium";
      else if (difficulty === 16) difficultyStr = "hard";

      // Use the full URL to ensure we hit the Flask backend on port 5000.
      fetch("http://127.0.0.1:5000/api/get_move", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: game.fen(),
          difficulty: difficultyStr
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            const bestMove = data.move; // UCI notation, e.g., "e7e5"
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            const aiMove = game.move({ from, to, promotion: 'q' });
            if (aiMove === null) {
              setMessage("Computer attempted an invalid move.");
            } else {
              setPosition(game.fen());
            }
          } else {
            setMessage("Error: " + data.message);
          }
          setIsComputerTurn(false);
        })
        .catch(err => {
          console.error("API error:", err);
          setIsComputerTurn(false);
        });
    }
  }, [isComputerTurn, mode, game, difficulty]);

  // Function to start a new game.
  const startNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setPosition(newGame.fen());
    setMessage('');
    setIsComputerTurn(false);
  };

  return (
    <div className="App">
      <h1>Chess App with AI</h1>
      
      {/* Mode Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label>Mode: </label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="human">Human vs. Human</option>
          <option value="ai">Human vs. Computer</option>
        </select>
      </div>
      
      {/* Difficulty Selector (only in AI mode) */}
      {mode === 'ai' && (
        <div style={{ marginBottom: '1rem' }}>
          <label>Difficulty: </label>
          <select value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}>
            <option value={5}>Easy</option>
            <option value={10}>Medium</option>
            <option value={16}>Hard</option>
          </select>
        </div>
      )}

      {/* Render the Chessboard */}
      <Chessboard position={position} onDrop={handleDrop} boardWidth={400} />
      
      {message && <p>{message}</p>}
      {game.isGameOver() && <button onClick={startNewGame}>Start New Game</button>}
    </div>
  );
}

export default App;




