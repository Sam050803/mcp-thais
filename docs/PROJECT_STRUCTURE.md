# 📁 Structure du Projet MCP Thaïs

```
mcp-thais/
├── 📂 src/                          # Code source TypeScript
│   ├── 📂 mcp/                      # Serveur MCP et outils
│   │   ├── server.ts                # Serveur principal
│   │   └── 📂 tools/                # 9 outils MCP
│   ├── 📂 services/                 # Services métier
│   ├── 📂 thais/                    # Client API Thaïs
│   ├── 📂 types/                    # Types TypeScript
│   ├── 📂 utils/                    # Utilitaires
│   ├── config.ts                    # Configuration
│   └── index.ts                     # Point d'entrée
│
├── 📂 deployment/                   # Infrastructure déploiement
│   ├── Dockerfile                   # Image Docker optimisée
│   ├── docker-compose.production.yml # Orchestration complète
│   └── .dockerignore               # Exclusions Docker
│
├── 📂 configs/                      # Configurations services
│   ├── nginx.conf                  # Reverse proxy + SSL
│   └── prometheus.yml              # Monitoring metrics
│
├── 📂 scripts/                      # Scripts automatisation
│   ├── deploy.sh                   # Déploiement automatisé
│   ├── monitor.sh                  # Monitoring & maintenance
│   └── health-check.sh             # Vérifications santé
│
├── 📂 docs/                         # Documentation
│   ├── README.md                   # Documentation API
│   ├── SCENARIOS_TEST.md           # Tests fonctionnels
│   └── 📂 deployment/              # Docs déploiement
│       └── DEPLOY.md               # Guide production
│
├── 📂 tests/                        # Tests automatisés
│   ├── 📂 unit/                    # Tests unitaires
│   └── 📂 integration/             # Tests intégration
│
├── 📂 build/                        # Code compilé (généré)
├── 📂 logs/                         # Logs application (généré)
├── 📂 backups/                      # Sauvegardes (généré)
│
├── 📄 package.json                  # Configuration Node.js
├── 📄 tsconfig.json                # Configuration TypeScript
├── 📄 .env                         # Variables développement
├── 📄 .env.example                 # Template variables
├── 📄 .env.production              # Variables production
├── 📄 .gitignore                   # Exclusions Git
└── 📄 README.md                    # Documentation principale
```

## 📋 Description des Dossiers

### **Développement**
- **`src/`** : Code source avec architecture modulaire
- **`tests/`** : Tests unitaires et d'intégration
- **`build/`** : Sortie compilation TypeScript

### **Déploiement** 
- **`deployment/`** : Tout pour containerisation et déploiement
- **`configs/`** : Configurations des services (nginx, prometheus)
- **`scripts/`** : Automatisation déploiement et maintenance

### **Documentation**
- **`docs/`** : Documentation technique et guides
- **`README.md`** : Point d'entrée documentation

### **Générés**
- **`logs/`** : Logs application et services
- **`backups/`** : Sauvegardes automatiques
- **`node_modules/`** : Dépendances Node.js

## 🎯 Avantages de cette Structure

### **✅ Séparation Claire**
- Code source isolé dans `src/`
- Infrastructure dans `deployment/`
- Scripts utilitaires dans `scripts/`

### **✅ Production Ready**
- Containerisation complète
- Configuration services séparée
- Documentation déploiement dédiée

### **✅ Maintenabilité**
- Structure logique et prévisible
- Séparation des responsabilités
- Scripts automatisés accessibles

### **✅ Évolutivité**
- Facile d'ajouter nouveaux services
- Configuration modulaire
- Documentation organisée

Cette structure suit les meilleures pratiques pour un projet professionnel prêt pour l'entretien technique ! 🚀