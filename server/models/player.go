package models

import "time"

// PlayerState represents the state of a player in the game
type PlayerState struct {
	ID        string     `json:"id"`
	Position  [3]float64 `json:"position"` // [x, y, z]
	Rotation  [4]float64 `json:"rotation"` // Quaternion [x, y, z, w]
	Speed     float64    `json:"speed"`
	Timestamp int64      `json:"timestamp"`
}

// BulletState represents the state of a bullet in the game
type BulletState struct {
	ID        string     `json:"id"`
	PlayerID  string     `json:"playerId"`
	Position  [3]float64 `json:"position"`
	Direction [3]float64 `json:"direction"`
	Speed     float64    `json:"speed"`
	Timestamp int64      `json:"timestamp"`
	TTL       int        `json:"ttl"` // Time to live in game ticks
}

// ClientMessage represents messages from client to server
type ClientMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// ServerMessage represents messages from server to clients
type ServerMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// NewPlayer creates a new player with default values
func NewPlayer(id string) *PlayerState {
	return &PlayerState{
		ID:        id,
		Position:  [3]float64{0, 100, 0},  // Starting position
		Rotation:  [4]float64{0, 0, 0, 1}, // Default rotation (no rotation)
		Speed:     0,
		Timestamp: time.Now().UnixMilli(),
	}
}

// NewBullet creates a new bullet
func NewBullet(id string, playerID string, position [3]float64, direction [3]float64, speed float64) *BulletState {
	return &BulletState{
		ID:        id,
		PlayerID:  playerID,
		Position:  position,
		Direction: direction,
		Speed:     speed,
		Timestamp: time.Now().UnixMilli(),
		TTL:       100, // 5 seconds at 20 ticks per second
	}
}
