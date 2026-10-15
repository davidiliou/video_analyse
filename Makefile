.PHONY: help install dev dev-web build build-web preview server typecheck \
	docker-build docker-up docker-down docker-logs docker-ps \
	up down logs clean

PORT ?= 8087
COMPOSE := docker compose

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances npm
	npm install

dev: ## Lance Electron + Vite (desktop)
	npm run dev

dev-web: ## Lance l’UI web seule (Vite)
	npm run dev:web

build: ## Build production (Electron + web)
	npm run build

build-web: ## Build SPA web uniquement
	npm run build:web

preview: ## Prévisualise le build web sur le port $(PORT)
	npm run preview

server: build-web ## Build SPA + API locale (port $(PORT), data/ )
	npm run server

typecheck: ## Vérifie TypeScript
	npm run typecheck

docker-build: ## Construit l’image Docker
	$(COMPOSE) build

docker-up: ## Démarre l’app Docker sur le port $(PORT)
	$(COMPOSE) up -d --build

docker-down: ## Arrête les conteneurs
	$(COMPOSE) down

docker-logs: ## Suit les logs Docker
	$(COMPOSE) logs -f

docker-ps: ## Statut des conteneurs
	$(COMPOSE) ps

up: docker-up ## Alias de docker-up

down: docker-down ## Alias de docker-down

logs: docker-logs ## Alias de docker-logs

clean: ## Supprime dist, dist-electron et node_modules
	rm -rf dist dist-electron node_modules
