# Black Yellow Calculator

A responsive calculator website built with plain HTML, CSS, and JavaScript.

## Features

- Black background with yellow accents
- Works well on desktop and Android devices
- Supports arithmetic: addition, subtraction, multiplication, division, and percentages
- Includes AC, delete, decimal point, sign toggle, and equals
- Keyboard input support
- Graceful divide-by-zero handling
- Clean, modern layout with large touch-friendly buttons

## Run locally

Open `index.html` directly in your browser, or serve the project from a local static server:

```bash
cd black-yellow-calculator
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy on Cloudflare Pages

1. Push this repository to GitHub.
2. Log in to Cloudflare.
3. Open Pages and click "Create a project".
4. Select the GitHub repository.
5. Choose the repository `black-yellow-calculator`.
6. Use these settings:
   - Framework preset: `None`
   - Build command: leave empty
   - Build output directory: `.`
7. Click "Save and Deploy".

This project is a static site, so no build step or backend is required.

## Files

- `index.html` — calculator structure
- `styles.css` — dark theme and responsive layout
- `script.js` — calculator logic and keyboard support
- `README.md` — setup and deployment instructions

## Notes

- No registration, API, or database is required.
- The project is ready for free hosting as a static site.
