package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jassi-singh/flight-simulator/server/config"
	"github.com/jassi-singh/flight-simulator/server/game"
	"github.com/jassi-singh/flight-simulator/server/network"
)

func main() {
	// Load configuration
	cfg := config.GetDefaultConfig()

	// Create a new game state
	gameState := game.NewGameState()

	// Create WebSocket handler
	wsHandler := network.NewWebSocketHandler(gameState)

	// Setup Gin router
	router := gin.Default()

	// Enable CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// API routes - these don't conflict with static files
	apiGroup := router.Group("/api")
	{
		// Health check endpoint
		apiGroup.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
				"time":   time.Now().Format(time.RFC3339),
			})
		})
	}

	// WebSocket endpoint - separate from static files
	router.GET("/ws", wsHandler.HandleConnection)

	// Create a file server handler for static files
	fileServer := http.FileServer(http.Dir(cfg.StaticFilesDir))

	// Use a custom handler for static files that doesn't interfere with other routes
	router.NoRoute(func(c *gin.Context) {
		// Don't handle API or WebSocket requests
		if c.Request.URL.Path == "/ws" ||
			(len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api") {
			c.Next()
			return
		}

		// Serve static files for all other requests
		fileServer.ServeHTTP(c.Writer, c.Request)
	})

	// Start game loop in a separate goroutine
	go gameLoop(gameState, wsHandler, cfg.TickInterval)

	// Start the server
	serverAddr := ":" + cfg.Port
	log.Printf("Starting server on %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// gameLoop runs the game update loop at the specified interval
func gameLoop(gameState *game.GameState, wsHandler *network.WebSocketHandler, tickInterval int) {
	ticker := time.NewTicker(time.Duration(tickInterval) * time.Millisecond)
	defer ticker.Stop()

	log.Printf("Game loop started, updating every %dms", tickInterval)

	for range ticker.C {
		// Update game state
		gameState.UpdateBullets()

		// Broadcast updated state to all clients
		wsHandler.BroadcastGameState()
	}
}
