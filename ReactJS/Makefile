# Clipboard2MD — Docker lifecycle
# Usage: make setup | make teardown | make logs | make restart

COMPOSE ?= docker compose
PORT    ?= 60001
URL     := http://localhost:$(PORT)

.DEFAULT_GOAL := help

.PHONY: help setup teardown up down rebuild restart logs ps open status db count reset-db

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Build the image and start the app (detached) on $(PORT)
	$(COMPOSE) up -d --build
	@echo "App running at $(URL)"

teardown: ## Stop and remove containers, networks, and the built image
	$(COMPOSE) down --rmi local --remove-orphans

up: ## Start containers (no rebuild)
	$(COMPOSE) up -d

down: ## Stop and remove containers and networks (keep image)
	$(COMPOSE) down --remove-orphans

rebuild: ## Force a clean rebuild without cache, then start
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

restart: down up ## Restart the app

logs: ## Follow application logs
	$(COMPOSE) logs -f

ps: status ## Alias for status
status: ## Show container status
	$(COMPOSE) ps

open: ## Open the app in the default browser
	@open $(URL) 2>/dev/null || xdg-open $(URL) 2>/dev/null || echo "Open $(URL)"

db: ## Open an interactive SQLite shell on the saved conversions
	$(COMPOSE) exec app sh -c 'apk add --no-cache sqlite >/dev/null 2>&1; sqlite3 $$DB_PATH'

count: ## Show how many conversions have been saved
	@curl -s $(URL)/api/conversions?limit=1 >/dev/null && \
		$(COMPOSE) exec -T app node -e 'const{listConversions}=await import("./server/db.js");console.log(listConversions(1000000).length,"saved conversions")'

reset-db: ## Stop the app and delete the persisted SQLite volume (destroys saved data)
	$(COMPOSE) down --remove-orphans
	docker volume rm $$(basename $$PWD | tr "[:upper:]" "[:lower:]")_clipboard2md-data 2>/dev/null \
		|| docker volume rm clipboard2md-data 2>/dev/null \
		|| echo "Volume already removed"
