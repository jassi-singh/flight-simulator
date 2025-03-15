package network

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jassi-singh/flight-simulator/server/game"
	"github.com/jassi-singh/flight-simulator/server/models"
)

// WebSocketHandler handles WebSocket connections and messaging
type WebSocketHandler struct {
	GameState *game.GameState
	Clients   map[string]*websocket.Conn
	Upgrader  websocket.Upgrader
	mu        sync.RWMutex
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(gameState *game.GameState) *WebSocketHandler {
	return &WebSocketHandler{
		GameState: gameState,
		Clients:   make(map[string]*websocket.Conn),
		Upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
	}
}

// HandleConnection handles a new WebSocket connection
func (wsh *WebSocketHandler) HandleConnection(c *gin.Context) {
	// Upgrade HTTP connection to WebSocket
	conn, err := wsh.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}

	// Generate a unique player ID
	playerID := generatePlayerID()
	log.Printf("New player connected: %s", playerID)

	// Store the connection
	wsh.mu.Lock()
	wsh.Clients[playerID] = conn
	wsh.mu.Unlock()

	// Create a new player
	player := models.NewPlayer(playerID)

	// Add player to game state
	wsh.GameState.AddPlayer(player)

	// Send initial game state to the new player
	wsh.sendInitialState(conn, playerID)

	// Broadcast new player joined
	wsh.BroadcastPlayerJoined(playerID)

	// Handle incoming messages
	wsh.handleMessages(conn, playerID)
}

// handleMessages processes incoming messages from a client
func (wsh *WebSocketHandler) handleMessages(conn *websocket.Conn, playerID string) {
	defer func() {
		// Close connection
		conn.Close()

		// Remove client
		wsh.mu.Lock()
		delete(wsh.Clients, playerID)
		wsh.mu.Unlock()

		// Remove player from game state
		wsh.GameState.RemovePlayer(playerID)

		// Broadcast player left
		wsh.BroadcastPlayerLeft(playerID)
	}()

	for {
		var message models.ClientMessage
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		// Process message based on its type
		switch message.Type {
		case "update":
			// Update player state
			if update, ok := message.Payload.(map[string]interface{}); ok {
				wsh.GameState.UpdatePlayerState(playerID, update)
			}

		case "shoot":
			// Handle shooting
			wsh.handlePlayerShoot(playerID, message.Payload)
		}
	}
}

// sendInitialState sends the initial game state to a new player
func (wsh *WebSocketHandler) sendInitialState(conn *websocket.Conn, playerID string) {
	// Send welcome message with player's ID
	welcomeMsg := models.ServerMessage{
		Type:    "welcome",
		Payload: map[string]string{"id": playerID},
	}
	conn.WriteJSON(welcomeMsg)

	// Get current game state
	players, bullets := wsh.GameState.GetState()

	// Send current game state
	stateMsg := models.ServerMessage{
		Type: "state",
		Payload: map[string]interface{}{
			"players": players,
			"bullets": bullets,
		},
	}
	conn.WriteJSON(stateMsg)
}

// BroadcastGameState broadcasts the current game state to all clients
func (wsh *WebSocketHandler) BroadcastGameState() {
	players, bullets := wsh.GameState.GetState()

	stateMsg := models.ServerMessage{
		Type: "state",
		Payload: map[string]interface{}{
			"players": players,
			"bullets": bullets,
		},
	}

	wsh.broadcast(stateMsg)
}

// BroadcastPlayerJoined broadcasts a player joined message to all clients
func (wsh *WebSocketHandler) BroadcastPlayerJoined(playerID string) {
	joinMsg := models.ServerMessage{
		Type:    "player_joined",
		Payload: map[string]string{"id": playerID},
	}

	wsh.broadcast(joinMsg)
}

// BroadcastPlayerLeft broadcasts a player left message to all clients
func (wsh *WebSocketHandler) BroadcastPlayerLeft(playerID string) {
	leftMsg := models.ServerMessage{
		Type:    "player_left",
		Payload: map[string]string{"id": playerID},
	}

	wsh.broadcast(leftMsg)
}

// handlePlayerShoot processes a shoot action from a player
func (wsh *WebSocketHandler) handlePlayerShoot(playerID string, payload interface{}) {
	// Extract direction and other data from payload
	if data, ok := payload.(map[string]interface{}); ok {
		// Get player position
		players, _ := wsh.GameState.GetState()
		player, exists := players[playerID]
		if !exists {
			return
		}

		// Extract direction if provided
		var direction [3]float64
		if dir, ok := data["direction"].([]interface{}); ok && len(dir) == 3 {
			direction = [3]float64{
				dir[0].(float64),
				dir[1].(float64),
				dir[2].(float64),
			}
		}

		// Create a new bullet
		bulletID := generateBulletID(playerID)
		bullet := models.NewBullet(
			bulletID,
			playerID,
			player.Position,
			direction,
			10.0, // Default bullet speed
		)

		// Add bullet to game state
		wsh.GameState.AddBullet(bullet)

		// Broadcast bullet created
		shotMsg := models.ServerMessage{
			Type:    "bullet_created",
			Payload: bullet,
		}
		wsh.broadcast(shotMsg)
	}
}

// broadcast sends a message to all connected clients
func (wsh *WebSocketHandler) broadcast(message models.ServerMessage) {
	wsh.mu.RLock()
	defer wsh.mu.RUnlock()

	for playerID, conn := range wsh.Clients {
		err := conn.WriteJSON(message)
		if err != nil {
			log.Printf("Error broadcasting to client %s: %v", playerID, err)
		}
	}
}

// Helper functions
func generatePlayerID() string {
	return "player-" + time.Now().Format("20060102150405.000") // Use timestamp as ID
}

func generateBulletID(playerID string) string {
	return "bullet-" + playerID + "-" + time.Now().Format("20060102150405.000")
}
