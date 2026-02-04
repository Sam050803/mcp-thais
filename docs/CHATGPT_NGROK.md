# 🌐 Support ChatGPT avec Ngrok

## 🎯 **Configuration ChatGPT via Ngrok**

Votre serveur MCP Thaïs peut aussi fonctionner avec **ChatGPT** en utilisant **ngrok** pour exposer le serveur local.

### **Étape 1 : Installation Ngrok**
```bash
# MacOS
brew install ngrok

# Ou télécharger depuis https://ngrok.com/download
```

### **Étape 2 : Démarrer le serveur MCP**
```bash
npm start
# Serveur sur http://localhost:3000/mcp
```

### **Étape 3 : Exposer avec Ngrok**
```bash
ngrok http 3000
```

Ngrok affichera une URL publique :
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### **Étape 4 : Configuration ChatGPT**

1. **Aller dans ChatGPT → Actions**
2. **Créer une nouvelle action** avec ce schema :

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

### **Étape 5 : Test ChatGPT**

Dans ChatGPT, posez la question :
> *"Y a t-il une chambre disponible pour 2 personnes du 6 au 12 février ?"*

ChatGPT utilisera automatiquement votre API MCP via ngrok ! 🎉

### **Avantages Ngrok :**
- ✅ **Universel** : Fonctionne avec n'importe quel service externe
- ✅ **Simplicité** : Une commande pour exposer le serveur
- ✅ **Sécurité** : Tunnel HTTPS automatique  
- ✅ **Debug** : Interface web ngrok pour voir les requêtes

### **Comparaison des modes :**

| Mode | Avantages | Inconvénients |
|------|-----------|---------------|
| **Claude Desktop** | Direct, rapide | Claude uniquement |
| **Ngrok + ChatGPT** | Universel, cloud | Setup plus complexe |
| **HTTP Local** | Simple dev | Local uniquement |

**Votre serveur supporte les 3 modes ! 🚀**