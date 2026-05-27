3D Printing Workshop Training Game
==================================

Open the game
-------------
1. Open this folder.
2. Double-click index.html.
3. If Windows asks which app to use, choose Google Chrome or Microsoft Edge.

What to share
-------------
Send the whole folder named:
3d-printing-workshop-game-share

Do not send only index.html. The game also needs the JavaScript, CSS, and assets folders in this package.

Game flow
---------
- index.html is the level selection page.
- level1.html is the guided workshop simulation.
- level2.html is the safety quiz. It unlocks after Level 1 is completed.

Progress
--------
Completion is saved in the browser on that laptop using localStorage.
If someone uses a different browser, private browsing, or clears browser data, progress may reset.

If double-click does not work
-----------------------------
Some school or managed laptops restrict local files. Use this fallback:

1. Open Command Prompt in this folder.
2. Run:
   python -m http.server 5173
3. Open:
   http://127.0.0.1:5173/index.html

If Python is not installed, try:
   py -m http.server 5173

Notes
-----
The game is designed to run locally. Internet is only used for the Space Grotesk font; if offline, the browser will use a fallback font.
