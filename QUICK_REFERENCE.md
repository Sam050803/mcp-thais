# Commandes rapides - MCP Thaïs

## 🏗️ Développement
```bash
npm run build              # Compiler TypeScript
npm run dev               # Mode développement (HTTP)  
npm start                 # Mode production (stdio)
npm test                  # Tests automatisés
```

## 🚀 Déploiement
```bash
npm run deploy:staging     # Déploiement test
npm run deploy:production  # Déploiement production
npm run docker:build      # Build image Docker
npm run docker:run        # Run container local
```

## 📊 Monitoring
```bash
npm run health-check       # Vérification santé
npm run monitor           # Dashboard monitoring
npm run logs              # Affichage logs
```

## 🔧 Maintenance
```bash
./scripts/monitor.sh status     # Status services
./scripts/monitor.sh backup     # Sauvegarde données
./scripts/monitor.sh cleanup    # Nettoyage système
./scripts/monitor.sh update     # Mise à jour services
```

## 📁 Structure Rapide
```
src/          → Code source TypeScript
deployment/   → Docker & infrastructure  
configs/      → Configurations services
scripts/      → Automatisation
docs/         → Documentation
tests/        → Tests automatisés
```