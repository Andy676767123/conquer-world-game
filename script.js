// Game constants
const MAP_SIZE = 5;
const CLAIM_COST = 50;
const ATTACK_COST = 5;
const RESOURCE_GAIN_INTERVAL = 5000; // 5 seconds
const RESOURCE_GAIN_CASH = 5;
const RESOURCE_GAIN_TROOPS = 2;

// Player colors
const COLORS = [
    { name: 'Player', rgb: 'rgb(70, 160, 90)' },
    { name: 'Enemy 1', rgb: 'rgb(220, 100, 70)' },
    { name: 'Enemy 2', rgb: 'rgb(70, 120, 220)' },
    { name: 'Enemy 3', rgb: 'rgb(180, 120, 220)' },
];

// Game state
let gameState = {
    cash: 200,
    troops: 20,
    tiles: {},
};

let enemyAI = [
    { id: 1, cash: 150, troops: 15 },
    { id: 2, cash: 150, troops: 15 },
    { id: 3, cash: 150, troops: 15 },
];

// Initialize game
function initGame() {
    // Clear existing tiles
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    gameState.tiles = {};

    // Create tiles
    for (let x = 1; x <= MAP_SIZE; x++) {
        for (let z = 1; z <= MAP_SIZE; z++) {
            const tileId = `${x}_${z}`;
            gameState.tiles[tileId] = {
                x,
                z,
                owner: 0, // 0 = neutral, 1 = player, 2+ = enemy
            };
        }
    }

    // Assign starting territories
    const allTiles = Object.values(gameState.tiles);
    assignStartingTerritory(0, 1); // Player
    assignStartingTerritory(1, 2);
    assignStartingTerritory(2, 3);
    assignStartingTerritory(3, 4);

    // Render board
    renderBoard();

    // Start resource generation
    setInterval(generateResources, RESOURCE_GAIN_INTERVAL);

    // Start enemy AI
    setInterval(enemyAIMove, RESOURCE_GAIN_INTERVAL * 2);
}

function assignStartingTerritory(index, playerId) {
    const allTiles = Object.values(gameState.tiles);
    const randomTile = allTiles[Math.floor(Math.random() * allTiles.length)];
    if (randomTile.owner === 0) {
        randomTile.owner = playerId;
    }
}

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    for (let x = 1; x <= MAP_SIZE; x++) {
        for (let z = 1; z <= MAP_SIZE; z++) {
            const tileId = `${x}_${z}`;
            const tile = gameState.tiles[tileId];
            const tileElement = createTileElement(tile);
            board.appendChild(tileElement);
        }
    }

    updateStats();
}

function createTileElement(tile) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.dataset.tileId = `${tile.x}_${tile.z}`;

    let owner = tile.owner;
    let className = 'neutral';
    let displayName = '⚪';
    let emoji = '';

    if (owner === 0) {
        className = 'neutral';
        displayName = 'Free';
        emoji = '⚪';
    } else if (owner === 1) {
        className = 'player';
        displayName = 'You';
        emoji = '🟢';
    } else {
        className = 'enemy';
        displayName = `Enemy ${owner}`;
        emoji = '🔴';
    }

    div.classList.add(className);
    div.innerHTML = `<div class="tile-emoji">${emoji}</div><div class="tile-label">${displayName}</div>`;

    div.addEventListener('click', () => handleTileClick(tile));

    return div;
}

function handleTileClick(tile) {
    const ownerId = tile.owner;

    // Check if player owns adjacent tile
    if (!ownsAdjacentTile(1, tile)) {
        showToast('❌ Must be adjacent to your territory!');
        return;
    }

    if (ownerId === 1) {
        showToast('✅ Already yours!');
        return;
    }

    if (ownerId === 0) {
        // Claim neutral tile
        if (gameState.cash < CLAIM_COST) {
            showToast('💰 Not enough cash!');
            return;
        }
        gameState.cash -= CLAIM_COST;
        tile.owner = 1;
        showToast('🎉 Territory claimed!');
    } else {
        // Attack enemy tile
        if (gameState.troops < ATTACK_COST) {
            showToast('⚔️ Not enough troops!');
            return;
        }
        gameState.troops -= ATTACK_COST;
        tile.owner = 1;
        showToast('⚔️ Territory conquered!');
    }

    renderBoard();
}

function ownsAdjacentTile(playerId, tile) {
    const { x, z } = tile;
    const adjacent = [
        gameState.tiles[`${x + 1}_${z}`],
        gameState.tiles[`${x - 1}_${z}`],
        gameState.tiles[`${x}_${z + 1}`],
        gameState.tiles[`${x}_${z - 1}`],
    ].filter(Boolean);

    return adjacent.some(t => t.owner === playerId);
}

function generateResources() {
    gameState.cash += RESOURCE_GAIN_CASH;
    gameState.troops += RESOURCE_GAIN_TROOPS;
    updateStats();
}

function enemyAIMove() {
    enemyAI.forEach(enemy => {
        const playerTiles = Object.values(gameState.tiles).filter(
            t => t.owner === 1
        );
        const enemyTiles = Object.values(gameState.tiles).filter(
            t => t.owner === enemy.id
        );
        const neutralTiles = Object.values(gameState.tiles).filter(
            t => t.owner === 0
        );

        // Try to claim a neutral adjacent tile
        for (let tile of neutralTiles) {
            if (
                ownsAdjacentTile(enemy.id, tile) &&
                enemy.cash >= CLAIM_COST
            ) {
                enemy.cash -= CLAIM_COST;
                tile.owner = enemy.id;
                break;
            }
        }

        // Try to attack player
        if (enemy.troops >= ATTACK_COST) {
            for (let tile of playerTiles) {
                if (ownsAdjacentTile(enemy.id, tile)) {
                    enemy.troops -= ATTACK_COST;
                    tile.owner = enemy.id;
                    break;
                }
            }
        }

        enemy.cash += RESOURCE_GAIN_CASH;
        enemy.troops += RESOURCE_GAIN_TROOPS;
    });

    renderBoard();
}

function updateStats() {
    document.getElementById('cash').textContent = gameState.cash;
    document.getElementById('troops').textContent = gameState.troops;
    const playerTiles = Object.values(gameState.tiles).filter(
        t => t.owner === 1
    ).length;
    document.getElementById('territory').textContent = playerTiles;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

function resetGame() {
    gameState = {
        cash: 200,
        troops: 20,
        tiles: {},
    };
    enemyAI = [
        { id: 1, cash: 150, troops: 15 },
        { id: 2, cash: 150, troops: 15 },
        { id: 3, cash: 150, troops: 15 },
    ];
    initGame();
    showToast('🔄 Game reset!');
}

// Event listeners
document.getElementById('reset-btn').addEventListener('click', resetGame);

// Start the game
initGame();