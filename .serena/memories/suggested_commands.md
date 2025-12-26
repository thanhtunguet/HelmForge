# Suggested Commands for HelmForge Development

## Development
```bash
# Start development server (runs on http://localhost:8080)
npm run dev
# or
bun dev
```

## Building
```bash
# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build
npm run preview
```

## Code Quality
```bash
# Run ESLint
npm run lint
```

## Package Management
```bash
# Install dependencies
npm install
# or
bun install

# Install specific package
npm install <package-name>
# or
bun add <package-name>
```

## Git Commands (Linux)
```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "message"

# Push to remote
git push

# Pull latest changes
git pull

# View log
git log --oneline
```

## File System Commands (Linux)
```bash
# List directory contents
ls -la

# Change directory
cd <directory>

# Find files
find . -name "*.ts"

# Search in files
grep -r "pattern" src/

# Copy files
cp source destination

# Move/rename files
mv source destination

# Remove files
rm file
```

## Notes
- **No testing framework** is currently configured
- **No Prettier** configuration file (formatting handled via ESLint)
- Development server uses **port 8080** (not the default Vite 5173)
- Server binds to `::` (all interfaces) for network access