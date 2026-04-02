# Chinese Chess (Xiangqi)

A lightweight interactive Chinese chess game you can play directly in the browser.

## Run

Since this is a static app, you can open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Features

- 9x10 Xiangqi board with all standard pieces
- Turn-based play (Red starts)
- Piece movement rules implemented:
  - General, Advisor, Elephant, Horse, Chariot, Cannon, Soldier
- Move highlighting for selected piece
- Basic legality validation including:
  - Palace and river restrictions
  - Horse-leg and elephant-eye blocking
  - Cannon screen rule
  - General-facing-general rule
- Win by capturing the opposing General
