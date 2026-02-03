/**
 * Client API Thaïs avec gestion automatique des tokens JWT
 * 
 * POINTS CLES :
 * - Auto-refresh des tokens JWT avant expiration
 * - Retry en cas d'erreur 401 (Unauthorized)
 * - Cache intelligent
 * - Logging de toutes les requêtes
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config.js';
import { SimpleCache } from '../utils/cache.js';
import { Logger } from '../utils/logger.js';
import type {
    LoginResponse, RoomType, Room, Availability,
    EReservation, CreateEReservationRequest
} from './thais.types.js';
import { th } from 'zod/locales';

export class ThaisClient {
    private axios: AxiosInstance;
    private cache: SimpleCache;
    private logger: Logger;
    private token: string | null = null;
    private tokenExpiresAt: number = 0;
    private loginPromise: Promise<void> | null = null;

    constructor() {
        this.cache = new SimpleCache(config.cache.ttl)
        this.logger = new Logger('ThaisClient');

        this.axios = axios.create({
            baseURL: config.thais.baseUrl,
            timeout: config.thais.timeout,
            headers: { 'Content-Type': 'application/json' },
        });

        // Intercepteur REQUEST : ajoute le token JWT
        this.axios.interceptors.request.use(async (requestConfig) => {
            if (requestConfig.url?.includes('/login')) return requestConfig;
            await this.ensureValidToken();
            if (this.token) {
                requestConfig.headers.Authorization = `Bearer ${this.token}`;
            }
            return requestConfig;
        });

        // Intercepteur RESPONSE : gestion des erreurs 401
        this.axios.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
                    this.logger.warn('Token expiré, renouvellement...');
                    this.token = null;
                    this.tokenExpiresAt = 0;
                    await this.ensureValidToken();
                    if (error.config) {
                        error.config.headers.Authorization = `Bearer ${this.token}`;
                        return this.axios.request(error.config);
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    private async ensureValidToken(): Promise<void> {
        if (this.token && Date.now() < this.tokenExpiresAt - 60000) return;
        if (this.loginPromise) {
            await this.loginPromise;
            return;
        }
        this.loginPromise = this.login();
        await this.loginPromise;
        this.loginPromise = null;
    }

    private async login(): Promise<void> {
        try {
            this.logger.info('Connexion à l\'API Thaïs...');
            const response = await this.axios.post<LoginResponse>('/api/partner/login', {
                username: config.thais.username,
                password: config.thais.password,
            });
            this.token = response.data.token;
            this.tokenExpiresAt = Date.now() + 9 * 60 * 1000; // 9 minutes
            this.logger.success('Connecté avec succès');
        } catch (error: any) {
            this.logger.error('Erreur de connexion', error.message);
            throw new Error(`Connexion impossible: ${error.message}`);
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>, useCache: boolean = false): Promise<T> {
        if (useCache && config.cache.enabled) {
            const cacheKey = SimpleCache.makeKey(endpoint, params);
            const cached = this.cache.get<T>(cacheKey);
            if (cached !== null) {
                this.logger.api('GET', endpoint, true);
                return cached;
            }
        }

        this.logger.api('GET', endpoint);
        const response = await this.axios.get<T>(endpoint, { params });

        if (useCache && config.cache.enabled) {
            const cacheKey = SimpleCache.makeKey(endpoint, params);
            this.cache.set(cacheKey, response.data);
        }

        return response.data;
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        this.logger.api('POST', endpoint);
        const response = await this.axios.post<T>(endpoint, data);
        return response.data;
    }

    // Méthodes spécifiques à l'API Thaïs
    async getRoomTypes(): Promise<RoomType[]> {
        return this.get<RoomType[]>('/api/partner/hotel/room-types', undefined, true);
    }

    async getRoomType(id: number): Promise<RoomType> {
        return this.get<RoomType>(`/api/partner/hotel/room-types/${id}`, undefined, true);
    }

    async getRooms(): Promise<Room[]> {
        return this.get<Room[]>('/api/partner/hotel/rooms', undefined, true);
    }

    async getAvailability(params: {
        checkIn: string;
        checkOut: string;
        adults: number;
        children?: number;
    }): Promise<Availability[]> {
        return this.get<Availability[]>('/api/partner/hotel/availability', {
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            adults: params.adults,
            children: params.children || 0,
        });
    };

    async createEReservation(data: CreateEReservationRequest): Promise<EReservation> {
        return this.post<EReservation>('/api/partner/booking/e-reservations', data);
    }

    clearCache(): void {
        this.cache.clear();
        this.logger.info('Cache vidé');
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.ensureValidToken();
            return true;
        } catch {
            return false;
        }
    }
}

export const thaisClient = new ThaisClient();