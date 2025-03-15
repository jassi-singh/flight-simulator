package config

// Config holds server configuration
type Config struct {
	Port           string
	TickRate       int // Game updates per second
	TickInterval   int // Milliseconds between game updates
	MaxPlayers     int
	StaticFilesDir string
}

// GetDefaultConfig returns the default server configuration
func GetDefaultConfig() *Config {
	return &Config{
		Port:           "8080",
		TickRate:       20,
		TickInterval:   50, // 50ms = 20 updates per second
		MaxPlayers:     16,
		StaticFilesDir: "../dist",
	}
}
