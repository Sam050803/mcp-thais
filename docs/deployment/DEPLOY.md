# 🚀 Guide de Déploiement Production - MCP Thaïs

## 📋 Vue d'ensemble

Ce projet est maintenant prêt pour un déploiement production professionnel avec :

- **Containerisation Docker** complète
- **Reverse proxy Nginx** avec SSL
- **Monitoring Prometheus** 
- **Scripts automatisés** de déploiement et maintenance
- **Sécurité** et bonnes pratiques

---

## 🏗️ Architecture de Déploiement

```
Internet
    ↓
[Load Balancer]  # Optionnel (AWS ALB, CloudFlare)
    ↓
[Nginx Reverse Proxy]  # SSL termination, rate limiting
    ↓
[MCP Thaïs Server(s)]  # Container(s) principal
    ↓
[Redis Cache]  # Cache distributé (optionnel)
    ↓
[API Thaïs]  # Service externe
```

---

## 🔧 Configuration Initiale

### 1. **Variables d'environnement**

Copiez et adaptez le fichier de production :
```bash
cp .env.production .env
nano .env
```

**Variables critiques à modifier :**
```bash
# Credentials API Thaïs (OBLIGATOIRE)
THAIS_USERNAME=your-production-username
THAIS_PASSWORD=your-production-password
THAIS_BASE_URL=https://production.thais-hotel.com/hub/api/partner

# Sécurité (OBLIGATOIRE)
JWT_SECRET=your-super-secret-256-bit-key-here
API_RATE_LIMIT=100

# Domain pour SSL
DOMAIN=your-domain.com
```

### 2. **Certificats SSL**

```bash
# Créer le dossier SSL
mkdir -p ssl

# Option A: Let's Encrypt (recommandé)
certbot --nginx -d your-domain.com

# Option B: Certificats existants
cp your-certificate.crt ssl/certificate.crt
cp your-private-key.key ssl/private.key
```

### 3. **Configuration Nginx**

Modifiez `nginx.conf` :
```bash
# Remplacez 'your-domain.com' par votre domaine
sed -i 's/your-domain.com/votre-domaine.fr/g' nginx.conf
```

---

## 🚀 Déploiement

### Méthode A: Script automatisé (Recommandé)

```bash
# Déploiement staging
./deploy.sh staging

# Déploiement production
./deploy.sh production
```

Le script effectue automatiquement :
- ✅ Build de l'image Docker
- ✅ Tests de validation
- ✅ Push vers registry (si production)
- ✅ Déploiement Docker Compose
- ✅ Health checks
- ✅ Nettoyage

### Méthode B: Manuel

```bash
# 1. Build
docker build -t mcp-thais:latest .

# 2. Test local
docker run -d -p 3000:3000 --env-file .env mcp-thais:latest

# 3. Déploiement
docker-compose -f docker-compose.production.yml up -d

# 4. Vérification
curl http://localhost/health
```

---

## 📊 Monitoring & Maintenance

### Script de monitoring automatisé

```bash
# Status des services
./monitor.sh status

# Logs en temps réel
./monitor.sh logs

# Monitoring continu
./monitor.sh monitor

# Menu interactif
./monitor.sh
```

### Endpoints de monitoring

```bash
# Health check
curl http://localhost/health

# Métriques Prometheus
curl http://localhost:9090/metrics

# Logs nginx
tail -f logs/nginx/access.log
```

---

## 🏥 Haute Disponibilité

### Load Balancing (multiple instances)

Modifiez `docker-compose.production.yml` :
```yaml
services:
  mcp-thais:
    deploy:
      replicas: 3  # 3 instances
    # ... reste de la config
```

### Auto-restart & Health checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  retries: 3
restart: unless-stopped
```

---

## 🔒 Sécurité

### Configuration de base (déjà incluse)

- ✅ **Container non-root** : User `mcp:1001`
- ✅ **Rate limiting** : 10 req/s par IP
- ✅ **SSL/TLS** : Configuration sécurisée
- ✅ **Headers sécurité** : HSTS, XSS protection
- ✅ **Variables d'env** : Secrets non exposés

### Sécurité avancée (recommandé)

```bash
# Firewall
ufw enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Fail2ban pour protection SSH
apt install fail2ban

# Backup chiffré
./monitor.sh backup
```

---

## 🌐 Déploiements Cloud

### AWS ECS

```bash
# 1. Push vers ECR
aws ecr get-login-password | docker login --username AWS --password-stdin
docker tag mcp-thais:latest your-account.dkr.ecr.region.amazonaws.com/mcp-thais:latest
docker push your-account.dkr.ecr.region.amazonaws.com/mcp-thais:latest

# 2. Déploiement ECS
aws ecs update-service --cluster mcp-cluster --service mcp-thais --force-new-deployment
```

### Google Cloud Run

```bash
# 1. Configuration gcloud
gcloud config set project your-project-id

# 2. Build et push
gcloud builds submit --tag gcr.io/your-project-id/mcp-thais

# 3. Déploiement
gcloud run deploy mcp-thais \
  --image gcr.io/your-project-id/mcp-thais \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Docker Swarm

```bash
# 1. Initialisation swarm
docker swarm init

# 2. Déploiement stack
docker stack deploy -c docker-compose.production.yml mcp-stack

# 3. Scaling
docker service scale mcp-stack_mcp-thais=3
```

---

## 📈 Performance & Optimisation

### Ressources recommandées

**Minimum (staging):**
- CPU: 0.5 core
- RAM: 512 MB
- Stockage: 5 GB

**Production:**
- CPU: 1-2 cores
- RAM: 1-2 GB  
- Stockage: 20 GB
- Réseau: 100 Mbps

### Cache et optimisation

```bash
# Redis pour cache distribué
docker-compose -f docker-compose.production.yml up -d redis

# Variables d'optimisation
CACHE_TTL=600000      # 10 minutes
CACHE_MAX_SIZE=2000   # 2000 entrées
HTTP_TIMEOUT=30000    # 30 secondes
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (exemple)

Créez `.github/workflows/deploy.yml` :
```yaml
name: Deploy Production
on:
  push:
    branches: [ main ]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: ./deploy.sh production
```

### GitLab CI (exemple)

Créez `.gitlab-ci.yml` :
```yaml
stages:
  - build
  - test  
  - deploy

deploy_production:
  stage: deploy
  script:
    - ./deploy.sh production
  only:
    - main
```

---

## 🆘 Troubleshooting

### Problèmes courants

**Service ne démarre pas :**
```bash
# Vérifier logs
./monitor.sh logs mcp-thais

# Vérifier configuration
docker-compose -f docker-compose.production.yml config
```

**Performance lente :**
```bash
# Stats ressources
docker stats

# Profiling
./monitor.sh monitor
```

**Erreurs SSL :**
```bash
# Vérifier certificats
openssl x509 -in ssl/certificate.crt -text -noout

# Renouveler Let's Encrypt
certbot renew
```

---

## 📚 Ressources

- **Documentation MCP** : https://modelcontextprotocol.io/
- **API Thaïs** : https://demo.thais-hotel.com/hub/doc/
- **Docker Best Practices** : https://docs.docker.com/develop/dev-best-practices/
- **Nginx Configuration** : https://nginx.org/en/docs/

---

## ✅ Checklist Production

### Avant déploiement
- [ ] Variables d'environnement configurées
- [ ] Certificats SSL en place  
- [ ] Domaine DNS pointé correctement
- [ ] Firewall configuré
- [ ] Monitoring configuré

### Tests post-déploiement
- [ ] Health check répond
- [ ] SSL/HTTPS fonctionne
- [ ] Rate limiting actif
- [ ] Logs générés correctement
- [ ] Backup automatique configuré

### Monitoring continu
- [ ] Alertes configurées (Prometheus/Grafana)
- [ ] Logs centralisés
- [ ] Métriques business suivies
- [ ] Sauvegardes automatiques

---

**🎯 Votre serveur MCP Thaïs est maintenant prêt pour la production !** 

Support technique disponible via les scripts `./monitor.sh` et `./deploy.sh`.