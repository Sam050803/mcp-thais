#!/bin/bash

# Script de déploiement production - MCP Thaïs
# Usage: ./deploy.sh [staging|production]

set -euo pipefail

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
APP_NAME="mcp-thais"
REGISTRY="your-registry.com"
VERSION=$(date +%Y%m%d-%H%M%S)
COMPOSE_FILE="deployment/docker-compose.production.yml"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérification des prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    command -v docker >/dev/null 2>&1 || log_error "Docker non installé"
    command -v docker-compose >/dev/null 2>&1 || log_error "Docker Compose non installé"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        command -v kubectl >/dev/null 2>&1 || log_warning "kubectl non installé (nécessaire pour Kubernetes)"
    fi
    
    log_success "Prérequis validés"
}

# Build de l'image Docker
build_image() {
    log_info "Construction de l'image Docker..."
    
    # Tag avec version et latest
    IMAGE_TAG="${REGISTRY}/${APP_NAME}:${VERSION}"
    LATEST_TAG="${REGISTRY}/${APP_NAME}:latest"
    
    docker build \
        --tag "$IMAGE_TAG" \
        --tag "$LATEST_TAG" \
        --build-arg NODE_ENV="$ENVIRONMENT" \
        --no-cache \
        -f deployment/Dockerfile \
        .
    
    log_success "Image construite: $IMAGE_TAG"
}

# Tests avant déploiement
run_tests() {
    log_info "Exécution des tests..."
    
    # Tests de build
    npm run build || log_error "Build failed"
    
    # Tests unitaires (si disponibles)
    if [[ -f "package.json" ]] && grep -q "\"test\"" package.json; then
        npm test || log_warning "Tests échoués"
    fi
    
    # Test de l'image Docker
    log_info "Test de l'image Docker..."
    CONTAINER_ID=$(docker run -d -p 3001:3000 "$IMAGE_TAG")
    
    sleep 10
    
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        log_success "Health check OK"
    else
        log_error "Health check échoué"
    fi
    
    docker stop "$CONTAINER_ID" && docker rm "$CONTAINER_ID"
}

# Push vers le registry
push_image() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Push vers le registry..."
        
        docker push "$IMAGE_TAG"
        docker push "$LATEST_TAG"
        
        log_success "Images pushées vers $REGISTRY"
    fi
}

# Déploiement Docker Compose
deploy_compose() {
    log_info "Déploiement avec Docker Compose..."
    
    # Backup de l'environnement actuel
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Sauvegarde de l'état actuel..."
        mkdir -p logs
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 > "logs/deploy-backup-$(date +%Y%m%d-%H%M%S).log"
    fi
    
    # Variables d'environnement
    export COMPOSE_PROJECT_NAME="${APP_NAME}-${ENVIRONMENT}"
    export IMAGE_TAG="$IMAGE_TAG"
    
    # Déploiement
    docker-compose -f "$COMPOSE_FILE" down || true
    docker-compose -f "$COMPOSE_FILE" pull
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Vérification
    sleep 15
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "Déploiement réussi"
    else
        log_error "Déploiement échoué"
    fi
}

# Déploiement Kubernetes (optionnel)
deploy_kubernetes() {
    if [[ "$ENVIRONMENT" == "production" && -f "k8s/deployment.yaml" ]]; then
        log_info "Déploiement Kubernetes..."
        
        # Mise à jour de l'image dans les manifests
        sed -i.bak "s|image: .*|image: $IMAGE_TAG|g" k8s/deployment.yaml
        
        # Application des manifests
        kubectl apply -f k8s/
        
        # Attendre le déploiement
        kubectl rollout status deployment/${APP_NAME} -n default --timeout=300s
        
        log_success "Déploiement Kubernetes terminé"
    fi
}

# Post-déploiement
post_deploy() {
    log_info "Vérifications post-déploiement..."
    
    # Health check final
    for i in {1..5}; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1; then
            log_success "Service accessible"
            break
        else
            log_warning "Tentative $i/5 - Service non accessible"
            sleep 5
        fi
    done
    
    # Nettoyage des anciennes images
    log_info "Nettoyage des anciennes images..."
    docker image prune -f
    
    # Logs de déploiement
    echo "Déploiement terminé: $(date)" >> "logs/deploy-history.log"
    echo "Version: $VERSION" >> "logs/deploy-history.log"
    echo "Environnement: $ENVIRONMENT" >> "logs/deploy-history.log"
    echo "---" >> "logs/deploy-history.log"
}

# Menu principal
main() {
    log_info "🚀 Déploiement MCP Thaïs - Environnement: $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    # Création du dossier logs
    mkdir -p logs
    
    # Exécution séquentielle
    check_requirements
    build_image
    run_tests
    push_image
    deploy_compose
    deploy_kubernetes
    post_deploy
    
    log_success "🎉 Déploiement terminé avec succès!"
    log_info "📊 Accès: http://localhost:3000"
    log_info "📋 Health: http://localhost:3000/health"
    log_info "📈 Metrics: http://localhost:3000/metrics"
}

# Exécution
main "$@"