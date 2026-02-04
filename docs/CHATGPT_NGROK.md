# Support ChatGPT via Ngrok

## Configuration Alternative

Le serveur MCP peut également être utilisé avec ChatGPT en exposant l'endpoint local via ngrok.

### Installation et Configuration

**1. Installation Ngrok**
```bash
# MacOS
brew install ngrok

# Ou téléchargement direct : https://ngrok.com/download
```

**2. Démarrage du serveur**
```bash
npm start
# Serveur disponible sur http://localhost:3000/mcp
```

**3. Exposition via Ngrok**
```bash
ngrok http 3000
```

Ngrok fournit une URL publique :
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

**4. Configuration ChatGPT Actions**

Création d'une action ChatGPT avec le schéma OpenAPI :

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Thaïs Hotel Management API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://abc123.ngrok.io"
    }
  ],
  "paths": {
    "/mcp": {
      "post": {
        "summary": "Execute MCP Tool",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "method": {
                    "type": "string",
                    "enum": ["tools/call"]
                  },
                  "params": {
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string",
                        "enum": [
                          "thais_check_availability",
                          "thais_list_room_types", 
                          "thais_get_room_details",
                          "thais_create_e_reservation"
                        ]
                      },
                      "arguments": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}
```

**5. Test de fonctionnement**

Exemple de requête :
```
"Y a t-il une chambre disponible pour 2 personnes du 6 au 12 février ?"
```

ChatGPT utilise automatiquement l'API MCP via ngrok.

## Comparaison des modes de déploiement

| Mode | Avantages | Inconvénients |
|------|-----------|---------------|
| **Claude Desktop** | Direct, rapide | Claude uniquement |
| **Ngrok + ChatGPT** | Universel, cloud | Configuration requise |
| **HTTP Local** | Développement simple | Local uniquement |

## Avantages techniques

- Tunnel HTTPS automatique
- Interface debug ngrok
- Compatible tout service externe
- Une commande pour exposer