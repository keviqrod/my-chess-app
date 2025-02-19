import React from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';

/*
  Chessboard Component
  Props:
    - position: a FEN string representing the current board state.
    - onDrop: function called when a piece is dropped.
    - boardWidth: optional number for board width in pixels.
*/
const Chessboard = ({ position, onDrop, boardWidth = 500 }) => {
  return (
    <div>
      <ReactChessboard 
        position={position} 
        onPieceDrop={onDrop}
        boardWidth={boardWidth}
      />
    </div>
  );
};

export default Chessboard;

