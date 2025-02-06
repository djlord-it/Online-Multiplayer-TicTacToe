# TicTacToe Ultimate

A modern, real-time multiplayer Tic-Tac-Toe game built with React and WebSocket technology. Play against friends in an engaging, beautifully designed interface with real-time updates and game state synchronization.

## Features
- Real-time multiplayer gameplay
- WebSocket-based connection for instant updates
- Responsive game board design
- Game state synchronization
- Mobile-friendly interface
- Shareable game links
- Modern, animated UI with dark theme
- Connection status indicator

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- shadcn/ui components
- Zustand (state management)
- WebSocket client

### Backend
- Node.js
- Express
- WebSocket server (`ws`)
- TypeScript

## Getting Started

### Clone the repository
```bash
git clone https://github.com/djlord-it/Online-Multiplayer-TicTacToe.git
cd Online-Multiplayer-TicTacToe
```

### Install dependencies
```bash
npm install
```

### Start the development server
```bash
npm run build && npm run dev
```

### Open the application
Open your browser and navigate to
```bash
http://localhost:8000
```

## Docker Deployment

### Run Locally with Docker
```bash
docker-compose up --build
```
The game will be available at
```bash
http://localhost:8000
```

### Run from GitHub Container Registry (GHCR)
Instead of building locally, you can pull the latest pre-built Docker image.

#### Login to GitHub Container Registry (only required once)
```bash
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u djlord-it --password-stdin
```
Replace `YOUR_GITHUB_TOKEN` with a [GitHub Personal Access Token](https://github.com/settings/tokens/new) with `read:packages` permission.

#### Pull the latest image from GHCR
```bash
docker pull ghcr.io/djlord-it/tictactoe:latest
```

#### Run the container
```bash
docker run -p 3000:80 ghcr.io/djlord-it/tictactoe:latest
```
The game will be accessible at
```bash
http://localhost:8000
```

### Pushing Updates to GHCR
If you make changes and need to update the Docker image:

#### Build the image
```bash
docker build -t ghcr.io/djlord-it/tictactoe:latest .
```

#### Push to GitHub Container Registry
```bash
docker push ghcr.io/djlord-it/tictactoe:latest
```

## Development
The project uses:
- Vite for fast development
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Tailwind CSS for styling
- WebSocket for real-time communication

## License
MIT License

## Contributing
Open to contributions.
