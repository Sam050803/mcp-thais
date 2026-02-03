/**
* Configuration centralisée de l'application.
* - Charge les variables d'environnement
* - Fournit une interface typée pour accéder aux paramètres de configuration
* - Facile à modifier
*/

import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
    thais: {
        baseUrl: string;
        username: string;
        password: string;
        timeout: number;
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
  cache: {
    ttl: getEnvNumber('CACHE_TTL', 300) * 1000,
    enabled: getEnvBoolean('CACHE_ENABLED', true),
  },
  debug: getEnvBoolean('DEBUG', false),
};

export function logConfig(): void {
  console.error('📋 Configuration chargée :');
  console.error(`   • API URL    : ${config.thais.baseUrl}`);
  console.error(`   • Username   : ${config.thais.username}`);
  console.error(`   • Debug mode : ${config.debug}`);
}