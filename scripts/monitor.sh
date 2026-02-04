#!/bin/bash

# Script de monitoring et maintenance - MCP Thaïs
# Usage: ./monitor.sh [status|logs|restart|backup]

set -euo pipefail

# Configuration
APP_NAME="mcp-thais"
COMPOSE_FILE="../deployment/docker-compose.production.yml"
LOG_DIR="../logs"
BACKUP_DIR="../backups"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Status des services
check_status() {
    log_info "📊 Status des services..."
    
    echo "=== Docker Compose Status ==="
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "=== Health Checks ==="
    
    # Health check MCP
    if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
        log_success "✅ MCP Server: OK"
    else
        log_error "❌ MCP Server: FAIL"
    fi
    
    # Health check Nginx
    if curl -s -f http://localhost/health >/dev/null 2>&1; then
        log_success "✅ Nginx: OK"
    else
        log_warning "⚠️  Nginx: Problème ou non configuré"
    fi
    
    echo ""
    echo "=== Resource Usage ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Affichage des logs
show_logs() {
    local service=${1:-}
    
    if [[ -n "$service" ]]; then
        log_info "📋 Logs du service: $service"
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f "$service"
    else
        log_info "📋 Logs de tous les services"
        echo "Services disponibles:"
        docker-compose -f "$COMPOSE_FILE" config --services
        echo ""
        read -p "Service à monitorer (ou 'all'): " service
        
        if [[ "$service" == "all" ]]; then
            docker-compose -f "$COMPOSE_FILE" logs --tail=50 -f
        else
            docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f "$service"
        fi
    fi
}

# Restart des services
restart_services() {
    local service=${1:-}
    
    if [[ -n "$service" ]]; then
        log_info "🔄 Restart du service: $service"
        docker-compose -f "$COMPOSE_FILE" restart "$service"
    else
        log_info "🔄 Restart de tous les services"
        docker-compose -f "$COMPOSE_FILE" restart
    fi
    
    sleep 10
    check_status
}

# Backup des données
backup_data() {
    log_info "💾 Sauvegarde des données..."
    
    # Création du dossier backup
    mkdir -p "$BACKUP_DIR"
    
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup des logs
    if [[ -d "$LOG_DIR" ]]; then
        cp -r "$LOG_DIR" "$backup_path/"
        log_success "✅ Logs sauvegardés"
    fi
    
    # Backup de la configuration
    cp .env* "$backup_path/" 2>/dev/null || true
    cp docker-compose*.yml "$backup_path/"
    cp nginx.conf "$backup_path/" 2>/dev/null || true
    
    # Backup des données Docker volumes
    if docker volume ls | grep -q redis-data; then
        docker run --rm -v redis-data:/data -v "$PWD/$backup_path":/backup alpine \
            tar czf /backup/redis-data.tar.gz -C /data .
        log_success "✅ Données Redis sauvegardées"
    fi
    
    # Compression finale
    cd "$BACKUP_DIR"
    tar czf "${backup_name}.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    log_success "💾 Backup terminé: $BACKUP_DIR/${backup_name}.tar.gz"
}

# Nettoyage du système
cleanup_system() {
    log_info "🧹 Nettoyage du système..."
    
    # Nettoyage des containers arrêtés
    docker container prune -f
    
    # Nettoyage des images inutiles
    docker image prune -f
    
    # Nettoyage des volumes orphelins
    docker volume prune -f
    
    # Nettoyage des réseaux
    docker network prune -f
    
    # Rotation des logs (garder 30 derniers jours)
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Rotation des backups (garder 10 derniers)
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    log_success "✅ Nettoyage terminé"
}

# Mise à jour des services
update_services() {
    log_info "🔄 Mise à jour des services..."
    
    # Backup avant mise à jour
    backup_data
    
    # Pull des nouvelles images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Redémarrage avec nouvelles images
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "✅ Services mis à jour"
    check_status
}

# Monitoring en temps réel
live_monitor() {
    log_info "📊 Monitoring en temps réel (Ctrl+C pour arrêter)..."
    
    while true; do
        clear
        echo "=== MCP Thaïs Monitoring - $(date) ==="
        echo ""
        
        # Stats rapides
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -5
        
        echo ""
        echo "=== Health Status ==="
        
        if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
            echo "✅ MCP Server: OK"
        else
            echo "❌ MCP Server: FAIL"
        fi
        
        echo ""
        echo "=== Recent Logs ==="
        docker-compose -f "$COMPOSE_FILE" logs --tail=5 mcp-thais | tail -5
        
        sleep 10
    done
}

# Menu principal
show_menu() {
    echo "🏨 MCP Thaïs - Monitoring & Maintenance"
    echo ""
    echo "1) Status des services"
    echo "2) Afficher logs"
    echo "3) Restart services"
    echo "4) Backup données"
    echo "5) Cleanup système"
    echo "6) Mise à jour"
    echo "7) Monitoring temps réel"
    echo "8) Quitter"
    echo ""
    read -p "Choisissez une option: " choice
    
    case $choice in
        1) check_status ;;
        2) show_logs ;;
        3) restart_services ;;
        4) backup_data ;;
        5) cleanup_system ;;
        6) update_services ;;
        7) live_monitor ;;
        8) exit 0 ;;
        *) log_error "Option invalide" ;;
    esac
}

# Main
case ${1:-menu} in
    status) check_status ;;
    logs) show_logs "${2:-}" ;;
    restart) restart_services "${2:-}" ;;
    backup) backup_data ;;
    cleanup) cleanup_system ;;
    update) update_services ;;
    monitor) live_monitor ;;
    menu) show_menu ;;
    *) 
        echo "Usage: $0 [status|logs|restart|backup|cleanup|update|monitor|menu]"
        exit 1
        ;;
esac