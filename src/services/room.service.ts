/**
 * Service de gestion des chambres
 */

import { thaisClient } from '../thais/thais.client.js';
import { Logger } from '../utils/logger.js';
import type { RoomType } from '../thais/thais.types.js';
import type { FormattedRoomType } from '../types/common.types.js';

export class RoomService {
    private logger = new Logger('RoomService');

    async listRoomTypes(): Promise<FormattedRoomType[]> {
        this.logger.info('Récupération des types de chambres...');
        const roomTypes = await thaisClient.getRoomTypes();
        const publicRoomTypes = roomTypes.filter((rt) => rt.public && !rt.deleted);
        const sorted = publicRoomTypes.sort((a, b) => a.rank - b.rank);
        const formatted = sorted.map((rt) => this.formatRoomType(rt));
        this.logger.success(`${formatted.length} type(s) trouvé(s)`);
        return formatted;
    }

    async getRoomDetails(roomTypeId: number): Promise<RoomType> {
        this.logger.info(`Récupération détails chambre #${roomTypeId}...`);
        
        // Récupérer le room type + les chambres physiques + tarifs échantillon
        const [roomTypes, rooms, rates] = await Promise.all([
            thaisClient.getRoomTypes(),
            thaisClient.getRooms(),
            thaisClient.get<any[]>('/api/partner/hotel/rates', undefined, true).catch(() => [])
        ]);

        const roomType = roomTypes.find(rt => rt.id === roomTypeId);
        if (!roomType) {
            throw new Error(`Type de chambre #${roomTypeId} non trouvé`);
        }

        // Enrichir avec les chambres physiques de ce type
        const physicalRooms = rooms.filter(room => room.room_type_id === roomTypeId);
        
        // Enrichir avec les tarifs (échantillon aujourd'hui)
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        let priceData: any[] = [];
        try {
            priceData = await thaisClient.getPrices({
                checkIn: today,
                checkOut: tomorrowStr,
                roomTypeIds: [roomTypeId]
            });
        } catch (error) {
            this.logger.warn('Tarifs non disponibles pour cette chambre');
        }

        this.logger.success(`Détails chambre "${roomType.label}" enrichis`);
        return { ...roomType, physicalRooms, rates, priceData } as any;
    }

    private formatRoomType(rt: RoomType): FormattedRoomType {
        return {
            id: rt.id,
            name: rt.label,
            capacity: `${rt.nb_persons_min}-${rt.nb_persons_max} personnes`,
            description: this.cleanHtml(rt.description || ''),
            pictureCount: rt.pictures?.length || 0,
        };
    }

    formatRoomTypesList(roomTypes: FormattedRoomType[]): string {
        if (roomTypes.length === 0) {
            return '😔 Aucun type de chambre disponible.';
        }

        let msg = `🏨 **${roomTypes.length} type${roomTypes.length > 1 ? 's' : ''} de chambre** :\n\n`;

        roomTypes.forEach((rt, idx) => {
            msg += `### ${idx + 1}. ${rt.name}\n`;
            msg += `- **ID** : ${rt.id}\n`;
            msg += `- **Capacité** : ${rt.capacity}\n`;
            if (rt.description) {
                const desc = rt.description.substring(0, 100);
                msg += `- **Description** : ${desc}${rt.description.length > 100 ? '...' : ''}\n`;
            }
            if (rt.pictureCount > 0) {
                msg += `- **Photos** : ${rt.pictureCount}\n`;
            }
            msg += '\n';
        });

        msg += `💡 Pour les détails : "Détails de la chambre [ID]"`;
        return msg;
    }

    formatRoomDetails(roomTypeData: any): string {
        const roomType = roomTypeData;
        let msg = `🏨 **${roomType.label}** (ID: ${roomType.id})\n\n`;
        
        // Section informations de base
        msg += `## 📋 Informations Générales\n`;
        msg += `- **Capacité** : ${roomType.nb_persons_min} à ${roomType.nb_persons_max} personne${roomType.nb_persons_max > 1 ? 's' : ''}\n`;
        msg += `- **Disponibilité** : ${roomType.public ? '✅ Réservable' : '❌ Non disponible'}\n`;
        msg += `- **Rang** : ${roomType.rank}\n`;
        if (roomType.color) {
            msg += `- **Couleur** : ${roomType.color}\n`;
        }

        // Section chambres physiques
        if (roomTypeData.physicalRooms && roomTypeData.physicalRooms.length > 0) {
            msg += `\n## 🚪 Chambres Physiques (${roomTypeData.physicalRooms.length})\n`;
            roomTypeData.physicalRooms.slice(0, 5).forEach((room: any, idx: number) => {
                msg += `- **${room.label}** (${room.stage}) - Capacité ${room.nb_persons_max} pers.\n`;
            });
            if (roomTypeData.physicalRooms.length > 5) {
                msg += `- ... et ${roomTypeData.physicalRooms.length - 5} autres chambres\n`;
            }
        }

        // Section tarifs échantillon
        if (roomTypeData.priceData && roomTypeData.priceData.length > 0) {
            const prices = roomTypeData.priceData;
            const avgPrice = prices.reduce((sum: number, p: any) => sum + p.price, 0) / prices.length;
            msg += `\n## 💰 Tarifs Indicatifs\n`;
            msg += `- **Prix moyen** : ${Math.round(avgPrice)}€/nuit\n`;
            
            const uniqueRates = [...new Set(prices.map((p: any) => p.rate?.label).filter(Boolean))];
            if (uniqueRates.length > 0) {
                msg += `- **Tarifs disponibles** : ${uniqueRates.slice(0, 3).join(', ')}\n`;
            }

            if (prices.some((p: any) => p.min_stay > 1)) {
                const minStays = prices.map((p: any) => p.min_stay).filter(Boolean);
                const maxMinStay = Math.max(...minStays);
                msg += `- **Séjour minimum** : ${maxMinStay} nuit${maxMinStay > 1 ? 's' : ''}\n`;
            }
        } else {
            msg += `\n## 💰 Tarifs\n`;
            msg += `- **Prix** : Sur demande selon dates\n`;
        }

        // Section description enrichie
        if (roomType.description) {
            const cleanDesc = this.cleanHtml(roomType.description);
            msg += `\n## 📝 Description & Équipements\n`;
            msg += `${cleanDesc}\n`;
            
            // Extraire des mots-clés d'équipements de la description
            const equipmentKeywords = [
                'wifi', 'climatisation', 'télévision', 'tv', 'minibar', 'coffre-fort',
                'balcon', 'terrasse', 'vue mer', 'vue montagne', 'douche', 'baignoire',
                'sèche-cheveux', 'peignoir', 'petit-déjeuner', 'parking', 'ascenseur'
            ];
            
            const foundEquipment = equipmentKeywords.filter(keyword => 
                cleanDesc.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundEquipment.length > 0) {
                msg += `\n### ⭐ Équipements détectés :\n`;
                foundEquipment.forEach(eq => {
                    msg += `- ${eq.charAt(0).toUpperCase() + eq.slice(1)}\n`;
                });
            }
        }

        // Section photos
        if (roomType.pictures && roomType.pictures.length > 0) {
            msg += `\n## 📸 Galerie Photos (${roomType.pictures.length})\n`;
            roomType.pictures.slice(0, 3).forEach((pic: string, idx: number) => {
                msg += `${idx + 1}. https://demo.thais-hotel.com${pic}\n`;
            });
            if (roomType.pictures.length > 3) {
                msg += `... et ${roomType.pictures.length - 3} autres photos\n`;
            }
        }

        // Section actions
        msg += `\n## 🎯 Actions Disponibles\n`;
        msg += `💡 **Vérifier disponibilités** : "Disponibilités du [date] au [date] pour ${roomType.nb_persons_max} personnes"\n`;
        msg += `💡 **Réserver** : "Réserver chambre ${roomType.id} du [date] au [date] pour [nom] [email]"\n`;
        msg += `💡 **Autres chambres** : "Quelles autres chambres avez-vous ?"\n`;

        return msg;
    }

    private cleanHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').trim();
    }
}

export const roomService = new RoomService();