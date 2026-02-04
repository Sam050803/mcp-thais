# 🧪 Scénarios de Test - Serveur MCP Thaïs

## 📝 Tests Fonctionnels par Outil

### 1. **Check Availability** - `thais_check_availability`

#### ✅ Scénarios de réussite :
```
"Y a-t-il une chambre disponible du 6 au 12 février pour 2 personnes ?"
"Disponibilités demain pour une famille avec 1 enfant"
"Vérifiez les disponibilités début mars pour 4 adultes"
"Du 15 au 20 juin, chambre pour 2"
```

#### ❌ Scénarios d'erreur :
```
"Disponibilités pour 0 personne" (doit échouer)
"Du 31 au 1er" (dates incohérentes)
"Disponibilités il y a 3 jours" (date passée)
```

### 2. **List Room Types** - `thais_list_room_types`

#### ✅ Test simple :
```
"Quelles chambres avez-vous ?"
"Liste des types de chambres disponibles"
"Montrez-moi vos hébergements"
```

### 3. **Room Details** - `thais_get_room_details`

#### ✅ Scénarios valides :
```
"Détails de la chambre 1"
"Informations sur la Suite (ID 3)"
"Équipements de la chambre Economy"
```

#### ❌ Scénarios d'erreur :
```
"Détails chambre 999" (ID inexistant)
"Chambre -1" (ID invalide)
```

### 4. **Create Reservation** - `thais_create_e_reservation`

#### ✅ Réservation complète :
```
"Réservez la chambre 2 du 15 au 20 juin pour Jean Dupont, email: jean@test.com, tél: 0612345678"
"Créer réservation Suite pour Marie Martin, du 1er au 5 mars, marie@email.fr, 0755443322"
```

#### ❌ Données invalides :
```
"Réservez pour M. X, email: invalide, tél: abc" (validation échoue)
"Réservation chambre 999" (chambre inexistante)
```

### 5. **Search Clients** - `search_clients`

#### ✅ Recherches CRM :
```
"Rechercher clients avec 'Moreau'"
"Clients niveau fidélité or"
"Clients ayant séjourné récemment"
"Limite à 5 résultats"
```

### 6. **Restaurant Sale** - `create_restaurant_sale`

#### ✅ Vente restaurant :
```
"Créer vente restaurant pour chambre 205: 2x Plat du jour à 25€, 1x Dessert à 8€, service dîner"
"Room service chambre 301: sandwich à 12€, boisson à 5€"
```

### 7. **Service Request** - `create_service_request`

#### ✅ Demandes service :
```
"Demande maintenance chambre 102: problème climatisation, priorité haute"
"Service ménage chambre 204, priorité normale, client Martin"
"Conciergerie chambre 305: réservation taxi, urgent"
```

### 8. **Housekeeping Status** - `get_housekeeping_status`

#### ✅ Statuts ménage :
```
"Statut ménage chambre 203"
"État nettoyage étage 2"
"Toutes les chambres sales"
"Rapport ménage détaillé"
```

### 9. **Sales Report** - `get_sales_report`

#### ✅ Rapports analytiques :
```
"Rapport ventes aujourd'hui"
"Statistiques cette semaine avec prévisions"
"Rapport détaillé par catégorie en EUR"
"Tendances mois dernier"
```

---

## 🔧 Tests d'Intégration

### A. **Test complet workflow réservation** :
1. "Quelles chambres avez-vous ?" → Liste des chambres
2. "Détails de la Suite" → Équipements et prix
3. "Disponibilités du 6 au 12 février pour 2 personnes" → Vérification
4. "Réservez Suite pour Jean Dupont..." → Création réservation
5. "Rechercher client Dupont" → Vérification CRM

### B. **Test workflow opérations** :
1. "Statut ménage étage 2" → État actuel
2. "Demande ménage chambre 205" → Création ticket
3. "Vente restaurant chambre 205: menu 35€" → Facturation
4. "Rapport ventes aujourd'hui" → Synthèse

---

## 🚨 Tests de Robustesse

### 1. **Dates complexes** :
```
"Disponibilités prochain weekend"
"Du lundi au vendredi de la semaine prochaine"
"Milieu du mois d'avril"
"Pendant les vacances de Pâques"
```

### 2. **Formats variés** :
```
"2 adults + 1 child" vs "2 adultes 1 enfant"
"chambre pour famille de 5"
"couple avec bébé"
```

### 3. **Gestion erreurs** :
```
"Réservation sans dates" (paramètres manquants)
"Chambre pour -5 personnes" (validation)
"Email sans @" (format invalide)
```

---

## ✅ Checklist de Validation

### Fonctionnalités Core :
- [ ] **Disponibilités** : Parsing dates + nb personnes OK
- [ ] **Réservations** : Création complète avec validation
- [ ] **Chambres** : Liste + détails complets
- [ ] **Formats dates** : "6 février", "demain", "début mars"

### Nouveaux Outils :
- [ ] **CRM** : Recherche clients fonctionne
- [ ] **Restaurant** : Facturation sur chambre
- [ ] **Services** : Création tickets avec priorité  
- [ ] **Ménage** : Suivi statuts en temps réel
- [ ] **Analytics** : Rapports avec prévisions

### Intégration Claude :
- [ ] **Tools Discovery** : 9 outils détectés
- [ ] **Conversations** : Parsing naturel français
- [ ] **Erreurs** : Messages clairs et utiles
- [ ] **Performance** : Réponses < 2 secondes

### API Thaïs :
- [ ] **Auth** : Connexion et renouvellement token
- [ ] **Cache** : Réduction appels répétitifs
- [ ] **Fallbacks** : Gestion indisponibilité API

---

## 🎯 Tests Spécifiques Entretien

### Scénario Business Complet :
```
1. "Bonjour, j'ai un client qui cherche une chambre"
2. "Du 6 au 12 février pour un couple avec un enfant"
3. "Montrez-moi les options disponibles"
4. "Détails de la Suite SVP"
5. "Parfait, réservez pour M. et Mme Dubois, laurent.dubois@company.com, 0798765432"
6. "Ils vont aussi dîner ce soir, ajoutez 2 menus à 45€ sur la chambre"
7. "Préparez un rapport des ventes pour ma direction"
```

**Résultat attendu** : Workflow fluide du conseil client à la facturation avec reporting.

### Test Performance :
```bash
# En parallèle dans Claude Desktop :
"Disponibilités février" + "Liste chambres" + "Statut ménage" + "Rapport ventes"
```
**Résultat attendu** : Toutes les réponses en < 5 secondes total.

---

## 📊 Métriques de Succès

- **Taux de réussite** : > 95% sur scénarios standards
- **Temps de réponse** : < 2s par outil
- **Parsing dates** : 100% sur formats français courants  
- **Validation** : Aucune donnée corrompue vers API
- **User Experience** : Conversation naturelle sans friction

**Ready pour entretien** ✅