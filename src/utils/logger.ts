/**
 * Logger structuré
 * Logs sur stderr car stdout est utilisé par MCP
 */

import { config } from '../config.js';

export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private timestamp(): string {
    return new Date().toISOString().slice(11, 19);
  }

  info(message: string, data?: any): void {
    console.error(`[${this.timestamp()}] ℹ️  [${this.context}] ${message}`);
    if (data && config.debug) {
      console.error(JSON.stringify(data, null, 2));
    }
  }

  success(message: string): void {
    console.error(`[${this.timestamp()}] ✅ [${this.context}] ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`[${this.timestamp()}] ❌ [${this.context}] ${message}`);
    if (error && config.debug) {
      console.error(error);
    }
  }

  warn(message: string): void {
    console.error(`[${this.timestamp()}] ⚠️  [${this.context}] ${message}`);
  }

  debug(message: string, data?: any): void {
    if (config.debug) {
      console.error(`[${this.timestamp()}] 🐛 [${this.context}] ${message}`);
      if (data) console.error(JSON.stringify(data, null, 2));
    }
  }

  api(method: string, url: string, cached: boolean = false): void {
    const cacheTag = cached ? ' [CACHE]' : '';
    console.error(`[${this.timestamp()}] 🌐 [${this.context}] ${method} ${url}${cacheTag}`);
  }
}

export const logger = new Logger();