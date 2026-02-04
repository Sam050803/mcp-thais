/**
* Configuration centralisée de l'application.
* - Charge les variables d'environnement en mode silencieux
* - Fournit une interface typée pour accéder aux paramètres de configuration
* - Facile à modifier
*/

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Charger .env manuellement (silencieux, pas de logs)
function loadEnvFile(): void {
    try {
        // Trouver le répertoire racine du projet
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const envPath = resolve(__dirname, '..', '.env');
        
        if (!existsSync(envPath)) {
            return; // Pas de .env, utiliser les variables d'environnement système
        }
        
        const content = readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            // Ignorer les commentaires et lignes vides
            if (!trimmed || trimmed.startsWith('#')) continue;
            
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;
            
            const key = trimmed.substring(0, eqIndex).trim();
            let value = trimmed.substring(eqIndex + 1).trim();
            
            // Supprimer les guillemets si présents
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            // Ne pas écraser les variables existantes
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    } catch {
        // Silencieux en cas d'erreur
    }
}

// Charger les variables d'environnement
loadEnvFile();

interface AppConfig {
    thais: {
        baseUrl: string;
        username: string;
        password: string;
        timeout: number;
    };
    mcp: {
        name: string;
        version: string;
        port: number;
    };
    cache: {
        ttl: number;
        enabled: boolean;
    };
    debug: boolean;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Variable d'environnement manquante : ${key}`);
  }
  return value;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const config: AppConfig = {
  thais: {
    baseUrl: getEnv('THAIS_BASE_URL', 'https://demo.thais-hotel.com/hub'),
    username: requireEnv('THAIS_USERNAME'),
    password: requireEnv('THAIS_PASSWORD'),
    timeout: getEnvNumber('API_TIMEOUT', 15000),
  },
  mcp: {
    name: 'mcp-thais',
    version: '1.0.0',
    port: getEnvNumber('PORT', 3000),
  },
  cache: {
    ttl: getEnvNumber('CACHE_TTL', 300) * 1000,
    enabled: getEnvBoolean('CACHE_ENABLED', true),
  },
  debug: getEnvBoolean('DEBUG', false),
};