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
        this.logger.info(`Récupération chambre #${roomTypeId}...`);
        const roomType = await thaisClient.getRoomType(roomTypeId);
        this.logger.success(`Chambre "${roomType.label}" récupérée`);
        return roomType;
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

    formatRoomDetails(roomType: RoomType): string {
        let msg = `🏨 **${roomType.label}** (ID: ${roomType.id})\n\n`;
        msg += `## 📋 Informations\n`;
        msg += `- **Capacité** : ${roomType.nb_persons_min} à ${roomType.nb_persons_max} personne${roomType.nb_persons_max > 1 ? 's' : ''}\n`;
        msg += `- **Disponible** : ${roomType.public ? '✅ Oui' : '❌ Non'}\n`;

        if (roomType.description) {
            const cleanDesc = this.cleanHtml(roomType.description);
            msg += `\n## 📝 Description\n${cleanDesc}\n`;
        }

        if (roomType.pictures && roomType.pictures.length > 0) {
            msg += `\n## 📸 Photos (${roomType.pictures.length})\n`;
            roomType.pictures.slice(0, 3).forEach((pic, idx) => {
                msg += `${idx + 1}. https://demo.thais-hotel.com${pic}\n`;
            });
        }

        msg += `\n💡 Vérifier disponibilités : "Disponibilités du [date] au [date]"`;
        return msg;
    }

    private cleanHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').trim();
    }
}

export const roomService = new RoomService();