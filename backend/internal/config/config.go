package config

import (
	"fmt"
)

type Config struct {
	DBUser     string
	DBPassword string
	DBHost     string
	DBPort     string
	DBName     string
}

func LoadConfig() Config {
	return Config{
		DBUser:     "root",
		DBPassword: "root",
		DBHost:     "host.docker.internal", // เปลี่ยนจาก localhost เป็น host.docker.internal
		DBPort:     "3306",
		DBName:     "AI_Smart_Event_Assistant",
	}
}

func (c Config) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s",
		c.DBUser,
		c.DBPassword,
		c.DBHost,
		c.DBPort,
		c.DBName,
	)
}
