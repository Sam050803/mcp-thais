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
    LoginResponse, RoomType, Room, Availability, AvailabilityRaw,
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

        const start = Date.now();
        this.logger.api('GET', endpoint);
        
        try {
            const response = await this.axios.get<T>(endpoint, { params });
            this.logger.info(`GET ${endpoint} terminé en ${Date.now() - start}ms`);

            if (useCache && config.cache.enabled) {
                const cacheKey = SimpleCache.makeKey(endpoint, params);
                this.cache.set(cacheKey, response.data);
            }

            return response.data;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.response?.data || error.message;
            this.logger.error(`GET ${endpoint} failed after ${Date.now() - start}ms`, errMsg);
            throw new Error(`Erreur API: ${JSON.stringify(errMsg)}`);
        }
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        const start = Date.now();
        this.logger.api('POST', endpoint);
        try {
            const response = await this.axios.post(endpoint, data, {
                responseType: 'text',
                transformResponse: [(data) => data]
            });
            this.logger.info(`POST ${endpoint} terminé en ${Date.now() - start}ms`);
            
            // L'API peut retourner des notices PHP avant le JSON, il faut les ignorer
            let responseText = response.data as string;
            const jsonStart = responseText.indexOf('{');
            if (jsonStart > 0) {
                responseText = responseText.substring(jsonStart);
            }
            
            return JSON.parse(responseText) as T;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.response?.data || error.message;
            this.logger.error(`POST ${endpoint} failed after ${Date.now() - start}ms`, errMsg);
            throw new Error(`Erreur API: ${JSON.stringify(errMsg)}`);
        }
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
        // Récupérer les disponibilités brutes
        const rawData = await this.get<AvailabilityRaw[]>('/api/partner/hotel/apr/availabilities/currents', {
            from: params.checkIn,
            to: params.checkOut,
        });
        
        // Filtrer les jours avec disponibilité > 0
        const available = rawData.filter(d => d.availability > 0);
        
        // Grouper par room_type_id et calculer le min de dispo sur la période
        const byRoomType = new Map<number, { minAvail: number; dates: string[] }>();
        for (const item of available) {
            const existing = byRoomType.get(item.room_type_id);
            if (existing) {
                existing.minAvail = Math.min(existing.minAvail, item.availability);
                existing.dates.push(item.date);
            } else {
                byRoomType.set(item.room_type_id, {
                    minAvail: item.availability,
                    dates: [item.date]
                });
            }
        }
        
        // Calculer le nombre de nuits demandées
        const checkInDate = new Date(params.checkIn);
        const checkOutDate = new Date(params.checkOut);
        const nbNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Récupérer les room types pour enrichir
        const roomTypes = await this.getRoomTypes();
        const roomTypesMap = new Map(roomTypes.map(rt => [rt.id, rt]));
        
        // Construire le résultat - ne garder que les room types disponibles sur TOUTES les nuits
        const result: Availability[] = [];
        for (const [roomTypeId, data] of byRoomType) {
            // Vérifier que toutes les nuits sont couvertes
            if (data.dates.length >= nbNights) {
                const roomType = roomTypesMap.get(roomTypeId);
                // Filtrer par capacité si on a les infos
                if (roomType && roomType.nb_persons_max >= params.adults) {
                    result.push({
                        room_type_id: roomTypeId,
                        room_type: roomType,
                        availableRooms: data.minAvail,
                        dates: data.dates
                    });
                }
            }
        }
        
        return result;
    }

    async createEReservation(data: CreateEReservationRequest): Promise<EReservation> {
        this.logger.info('eRéservation payload:', JSON.stringify(data, null, 2));
        return this.post<EReservation>('/api/partner/hotel/ebookings', data);
    }

    async searchClients(params: any): Promise<any[]> {
        return this.get<any[]>('/api/partner/resort/customers', params, true);
    }

    async getClient(id: number): Promise<any> {
        return this.get<any>(`/api/partner/resort/customers/${id}`, undefined, true);
    }

    async getClientBookings(clientId: number): Promise<any[]> {
        return this.get<any[]>('/api/partner/hotel/bookings', { customer_id: clientId }, true);
    }

    // Nouvelles méthodes pour les services avancés

    async createPurchase(purchaseData: any): Promise<any> {
        this.logger.info('Création achat/vente...');
        
        try {
            const response = await this.axios.post('/hub/api/partner/resort/purchases', purchaseData);
            return response.data;
        } catch (error: any) {
            this.logger.error('Erreur création achat:', error.message);
            throw new Error(`Échec création achat: ${error.response?.data?.message || error.message}`);
        }
    }

    async createServiceRequest(requestData: any): Promise<any> {
        this.logger.info('Création demande de service...');
        
        try {
            const response = await this.axios.post('/hub/api/partner/service/requests', requestData);
            return response.data;
        } catch (error: any) {
            this.logger.error('Erreur demande service:', error.message);
            throw new Error(`Échec demande service: ${error.response?.data?.message || error.message}`);
        }
    }

    async getHousekeepingStatus(query: any): Promise<any> {
        this.logger.info(`Récupération état ménage ${query.date}...`);
        
        try {
            const params = new URLSearchParams(query);
            const response = await this.axios.get(`/hub/api/partner/housekeeping/status?${params}`);
            return response.data;
        } catch (error: any) {
            this.logger.error('Erreur état ménage:', error.message);
            throw new Error(`Échec récupération ménage: ${error.response?.data?.message || error.message}`);
        }
    }

    async getSalesData(query: any): Promise<any> {
        this.logger.info(`Récupération données ventes ${query.start_date} - ${query.end_date}...`);
        
        try {
            const params = new URLSearchParams(query);
            const response = await this.axios.get(`/hub/api/partner/resort/sales-data?${params}`);
            return response.data;
        } catch (error: any) {
            this.logger.error('Erreur données ventes:', error.message);
            throw new Error(`Échec récupération ventes: ${error.response?.data?.message || error.message}`);
        }
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