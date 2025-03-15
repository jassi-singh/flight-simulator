package game

import (
	"log"
	"sync"
	"time"

	"github.com/jassi-singh/flight-simulator/server/models"
)

// GameState represents the entire game state
type GameState struct {
	Players map[string]*models.PlayerState `json:"players"`
	Bullets map[string]*models.BulletState `json:"bullets"`
	mu      sync.RWMutex
}

// NewGameState creates a new game state
func NewGameState() *GameState {
	return &GameState{
		Players: make(map[string]*models.PlayerState),
		Bullets: make(map[string]*models.BulletState),
	}
}

// AddPlayer adds a player to the game state
func (gs *GameState) AddPlayer(player *models.PlayerState) {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	gs.Players[player.ID] = player
	log.Printf("Player added: %s", player.ID)
}

// RemovePlayer removes a player from the game state
func (gs *GameState) RemovePlayer(playerID string) {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	delete(gs.Players, playerID)
	log.Printf("Player removed: %s", playerID)
}

// UpdatePlayerState updates a player's state
func (gs *GameState) UpdatePlayerState(playerID string, update map[string]interface{}) {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	player, exists := gs.Players[playerID]
	if !exists {
		return
	}

	// Extract position if provided
	if pos, ok := update["position"].([]interface{}); ok && len(pos) == 3 {
		player.Position = [3]float64{
			pos[0].(float64),
			pos[1].(float64),
			pos[2].(float64),
		}
	}

	// Extract rotation if provided
	if rot, ok := update["rotation"].([]interface{}); ok && len(rot) == 4 {
		player.Rotation = [4]float64{
			rot[0].(float64),
			rot[1].(float64),
			rot[2].(float64),
			rot[3].(float64),
		}
	}

	// Extract speed if provided
	if speed, ok := update["speed"].(float64); ok {
		player.Speed = speed
	}

	player.Timestamp = time.Now().UnixMilli()
}

// AddBullet adds a bullet to the game state
func (gs *GameState) AddBullet(bullet *models.BulletState) {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	gs.Bullets[bullet.ID] = bullet
}

// RemoveBullet removes a bullet from the game state
func (gs *GameState) RemoveBullet(bulletID string) {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	delete(gs.Bullets, bulletID)
}

// GetState returns a copy of the current game state
func (gs *GameState) GetState() (map[string]*models.PlayerState, map[string]*models.BulletState) {
	gs.mu.RLock()
	defer gs.mu.RUnlock()

	// Create copies to avoid race conditions
	playersCopy := make(map[string]*models.PlayerState, len(gs.Players))
	bulletsCopy := make(map[string]*models.BulletState, len(gs.Bullets))

	for id, player := range gs.Players {
		playersCopy[id] = player
	}

	for id, bullet := range gs.Bullets {
		bulletsCopy[id] = bullet
	}

	return playersCopy, bulletsCopy
}

// UpdateBullets updates all bullets' positions and removes expired bullets
func (gs *GameState) UpdateBullets() {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	for id, bullet := range gs.Bullets {
		// Update position based on direction and speed
		bullet.Position[0] += bullet.Direction[0] * bullet.Speed
		bullet.Position[1] += bullet.Direction[1] * bullet.Speed
		bullet.Position[2] += bullet.Direction[2] * bullet.Speed

		// Decrease TTL
		bullet.TTL--

		// Remove expired bullets
		if bullet.TTL <= 0 {
			delete(gs.Bullets, id)
		}
	}

	// TODO: Add collision detection between bullets and players/balloons
}
