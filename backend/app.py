from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS  # For handling CORS
import os
import chess
import pickle
from uuid import uuid4
from stockfish import Stockfish  # pip install stockfish

# Create the Flask app; serve static files from the "build" folder.
app = Flask(__name__, static_folder='build', static_url_path='')
app.config['SECRET_KEY'] = 'yoursupersecretkey'

# Enable CORS for API endpoints from the React dev server (http://localhost:3000)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# After every request, add headers required for cross-origin isolation.
@app.after_request
def add_cors_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    if request.path.endswith('.wasm'):
        response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
    return response

# --- API Endpoints (defined before the catch-all route) ---

def load_game():
    game_data = request.cookies.get('game')
    if game_data:
        board = pickle.loads(game_data.encode())
    else:
        board = chess.Board()
    return board

def save_game(board):
    return pickle.dumps(board).decode()

@app.route('/move', methods=['POST'])
def make_move():
    board = load_game()
    move = request.json.get('move')
    try:
        chess_move = board.parse_san(move)
        board.push(chess_move)
        return jsonify({'status': 'success', 'board': board.fen()})
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Invalid move: ' + str(e)})

@app.route('/api/get_move', methods=['POST'])
def get_ai_move():
    try:
        data = request.get_json()
        fen = data.get("fen")
        difficulty = data.get("difficulty", "medium")
        
        if not fen:
            return jsonify({"status": "error", "message": "FEN not provided"}), 400

        # Map difficulty to Stockfish parameters.
        if difficulty == "easy":
            skill_level = 5
            movetime = 500  # milliseconds
        elif difficulty == "medium":
            skill_level = 10
            movetime = 1000
        elif difficulty == "hard":
            skill_level = 16
            movetime = 2000
        else:
            skill_level = 10
            movetime = 1000

        # Use the absolute path to the Stockfish binary.
        stockfish_path = os.path.abspath("stockfish.bin/stockfish-windows-x86-64-avx2.exe")
        print("Using Stockfish binary at:", stockfish_path)
        print("Difficulty:", difficulty, "Skill Level:", skill_level, "Movetime:", movetime)
        
        stockfish = Stockfish(path=stockfish_path, depth=15, parameters={"Skill Level": skill_level})
        stockfish.set_fen_position(fen)
        best_move = stockfish.get_best_move_time(movetime)
        if best_move is None:
            return jsonify({"status": "error", "message": "Could not compute move"}), 400
        return jsonify({"status": "success", "move": best_move})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

# --- Catch-all Route for Serving the React App ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    app.run(debug=True)





