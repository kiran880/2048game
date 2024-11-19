class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameOver = false;
        this.init3DScene();
        this.setupEventListeners();
        this.initGame();
    }

    init3DScene() {
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        document.body.insertBefore(this.renderer.domElement, document.body.firstChild);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        this.camera.position.z = 5;

        // Create floating particles
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(`hsl(${Math.random() * 360}, 50%, 50%)`),
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
            
            this.particles.push(particle);
            this.scene.add(particle);
        }

        // Start animation loop
        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        // Animate particles
        this.particles.forEach(particle => {
            particle.position.add(particle.velocity);

            // Bounce off boundaries
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(particle.position[axis]) > 5) {
                    particle.velocity[axis] *= -1;
                }
            });

            particle.rotation.x += 0.01;
            particle.rotation.y += 0.01;
        });

        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Mouse/Touch controls
        let startX, startY, endX, endY;
        const minSwipeDistance = 50; // Minimum distance for a swipe
        
        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        };
        
        const handleMouseStart = (e) => {
            startX = e.clientX;
            startY = e.clientY;
        };
        
        const handleTouchEnd = (e) => {
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            endX = touch.clientX;
            endY = touch.clientY;
            handleSwipe();
        };
        
        const handleMouseEnd = (e) => {
            if (!startX || !startY) return;
            
            endX = e.clientX;
            endY = e.clientY;
            handleSwipe();
        };
        
        const handleSwipe = () => {
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.handleKeyPress({ key: 'ArrowRight' });
                } else {
                    this.handleKeyPress({ key: 'ArrowLeft' });
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.handleKeyPress({ key: 'ArrowDown' });
                } else {
                    this.handleKeyPress({ key: 'ArrowUp' });
                }
            }
            
            // Reset values
            startX = startY = endX = endY = null;
        };
        
        // Add touch event listeners
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);
        
        // Add mouse event listeners
        document.addEventListener('mousedown', handleMouseStart);
        document.addEventListener('mouseup', handleMouseEnd);
        
        // Button controls
        document.querySelector('.new-game-button').addEventListener('click', () => this.initGame());
        document.querySelector('.retry-button').addEventListener('click', () => this.initGame());

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.updateScore();
        this.addNewTile();
        this.addNewTile();
        this.updateGrid();
        document.querySelector('.game-message').classList.remove('game-over');
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateGrid() {
        const container = document.querySelector('.tile-container');
        container.innerHTML = '';

        const gameContainer = document.querySelector('.game-container');
        const cellSize = (gameContainer.offsetWidth - 30) / 4; // 30px for padding
        const gap = 15;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.grid[i][j]}`;
                    tile.textContent = this.grid[i][j];
                    
                    // Calculate position based on container size
                    const top = 15 + i * (cellSize + gap);
                    const left = 15 + j * (cellSize + gap);
                    
                    tile.style.top = `${top}px`;
                    tile.style.left = `${left}px`;
                    tile.style.width = `${cellSize}px`;
                    tile.style.height = `${cellSize}px`;
                    
                    container.appendChild(tile);
                }
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            document.getElementById('best-score').textContent = this.bestScore;
        }
    }

    handleKeyPress(event) {
        if (this.gameOver) return;

        let moved = false;
        const oldGrid = JSON.stringify(this.grid);

        switch(event.key) {
            case 'ArrowUp':
                moved = this.moveUp();
                break;
            case 'ArrowDown':
                moved = this.moveDown();
                break;
            case 'ArrowLeft':
                moved = this.moveLeft();
                break;
            case 'ArrowRight':
                moved = this.moveRight();
                break;
            default:
                return;
        }

        if (moved) {
            this.addNewTile();
            this.updateGrid();
            this.updateScore();

            if (this.checkGameOver()) {
                this.gameOver = true;
                document.querySelector('.game-message').classList.add('game-over');
                document.querySelector('.game-message p').textContent = 'Game Over!';
            }
        }
    }

    moveRow(row) {
        const nonZero = row.filter(cell => cell !== 0);
        const merged = [];
        for (let i = 0; i < nonZero.length; i++) {
            if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
                merged.push(nonZero[i] * 2);
                this.score += nonZero[i] * 2;
                i++;
            } else {
                merged.push(nonZero[i]);
            }
        }
        return merged.concat(Array(4 - merged.length).fill(0));
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const oldRow = [...this.grid[i]];
            this.grid[i] = this.moveRow(this.grid[i]);
            if (JSON.stringify(oldRow) !== JSON.stringify(this.grid[i])) {
                moved = true;
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const oldRow = [...this.grid[i]];
            this.grid[i] = this.moveRow([...this.grid[i]].reverse()).reverse();
            if (JSON.stringify(oldRow) !== JSON.stringify(this.grid[i])) {
                moved = true;
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const oldColumn = this.grid.map(row => row[j]);
            const column = this.moveRow(oldColumn);
            if (JSON.stringify(oldColumn) !== JSON.stringify(column)) {
                moved = true;
                for (let i = 0; i < 4; i++) {
                    this.grid[i][j] = column[i];
                }
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const oldColumn = this.grid.map(row => row[j]);
            const column = this.moveRow([...oldColumn].reverse()).reverse();
            if (JSON.stringify(oldColumn) !== JSON.stringify(column)) {
                moved = true;
                for (let i = 0; i < 4; i++) {
                    this.grid[i][j] = column[i];
                }
            }
        }
        return moved;
    }

    checkGameOver() {
        // Check for empty cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if (
                    (i < 3 && current === this.grid[i + 1][j]) ||
                    (j < 3 && current === this.grid[i][j + 1])
                ) {
                    return false;
                }
            }
        }

        return true;
    }
}

// Start the game when the page loads
window.onload = function() {
    const game = new Game2048();
};
