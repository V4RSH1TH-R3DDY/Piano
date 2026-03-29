# PianoFlow

Interactive piano learning app (HTML/CSS/JS modules).

## Run locally

Because this project uses ES modules (`<script type="module">`), open it through a local HTTP server (not `file://`).

### Linux

#### Option 1: Python dev server (recommended)

```bash
cd /home/varshith/Piano
python3 -m http.server 5500
```

Open: `http://localhost:5500`

#### Option 2: Node dev server

```bash
cd /home/varshith/Piano
npx serve -l 5500 .
```

Open: `http://localhost:5500`

### Windows

#### Option 1: Python dev server (recommended)

```powershell
cd C:\path\to\Piano
py -m http.server 5500
```

Open: `http://localhost:5500`

#### Option 2: Node dev server

```powershell
cd C:\path\to\Piano
npx serve -l 5500 .
```

Open: `http://localhost:5500`

## Stop the server

- Linux/macOS terminal: `Ctrl + C`
- Windows PowerShell/CMD: `Ctrl + C`

## Notes

- No build step is required.
- If `npx serve` asks to install `serve`, type `y` and press Enter.
