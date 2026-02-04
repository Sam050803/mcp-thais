/**
 * Service de gestion des réservations
 */

import { thaisClient } from '../thais/thais.client.js';
import { validator } from '../utils/validator.js';
import { dateParser, DateParser } from '../utils/date-parser.js';
import { Logger } from '../utils/logger.js';
import type { EReservation, CreateEReservationRequest } from '../thais/thais.types.js';
import type { CreateReservationParams } from '../types/common.types.js';


export class ReservationService {
    private logger = new Logger('ReservationService');

    async create(params: CreateReservationParams): Promise<EReservation> {
        this.logger.info('Création e-réservation...', { roomTypeId: params.roomTypeId });

        const checkIn = dateParser.parse(params.checkIn);
        const checkOut = dateParser.parse(params.checkOut);

        if (!DateParser.isValidDate(checkIn) || !DateParser.isValidDate(checkOut)) {
            throw new Error('Dates invalides');
        }

        const firstName = validator.validateName(params.guestFirstName, 'Prénom');
        const lastName = validator.validateName(params.guestLastName, 'Nom');
        const email = validator.validateEmail(params.guestEmail);
        const phone = validator.validatePhone(params.guestPhone);

        // Format selon la doc API Thaïs pour /hub/api/partner/hotel/ebookings
        const request: CreateEReservationRequest = {
            checkin: checkIn,
            checkout: checkOut,
            customer_civility_id: 1, // Mme & M.
            customer_firstname: firstName,
            customer_lastname: lastName,
            customer_email: email,
            customer_phone: phone || '',
            customer_country: 'FR',
            channel_name: 'MCP Agent',
            comment: `Réservation via assistant IA - ${params.adults} adulte(s)${params.children ? `, ${params.children} enfant(s)` : ''}`,
            payment_amount: 0,
            insurance_amount: 0,
            booking_rooms: [{
                room_type_id: params.roomTypeId,
                rate_id: params.rateId || 2,  // rate_id 2 = Non annulable, supporte 1-5 personnes
                nb_persons: {
                    adults: params.adults,
                    children: params.children || 0
                }
            }]
        };

        const reservation = await thaisClient.createEReservation(request);
        this.logger.success(`E-réservation créée : #${reservation.id}`);

        return reservation;
    }

    formatCreationResponse(reservation: EReservation, params: CreateReservationParams): string {
        const nbNights = DateParser.calculateNights(
            dateParser.parse(params.checkIn),
            dateParser.parse(params.checkOut)
        );

        // Calculer le prix total depuis les chambres
        const totalPrice = reservation.booking_rooms?.reduce((sum, room) => sum + (room.price || 0), 0) || 0;
        const roomType = reservation.booking_rooms?.[0]?.room_type;

        let msg = `🎉 **Pré-réservation créée avec succès !**\n\n`;
        msg += `## 📋 Récapitulatif\n`;
        msg += `- **N° réservation** : ${reservation.external_reference || reservation.id}\n`;
        msg += `- **Chambre** : ${roomType?.label || `Type #${params.roomTypeId}`}\n`;
        msg += `- **Dates** : ${reservation.checkin} → ${reservation.checkout}\n`;
        msg += `- **Durée** : ${nbNights} nuit${nbNights > 1 ? 's' : ''}\n`;
        msg += `- **Voyageurs** : ${params.adults} adulte${params.adults > 1 ? 's' : ''}`;
        if (params.children) msg += ` + ${params.children} enfant${params.children > 1 ? 's' : ''}`;
        msg += '\n';

        if (totalPrice > 0) {
            msg += `- **Prix total** : ${totalPrice.toFixed(2)} €\n`;
        }

        msg += `\n## 👤 Client\n`;
        msg += `- **Nom** : ${reservation.customer_firstname} ${reservation.customer_lastname}\n`;
        msg += `- **Email** : ${reservation.customer_email}\n`;

        msg += `\n📧 Confirmation envoyée à ${reservation.customer_email}\n`;
        msg += `⏰ L'hôtel confirmera sous 24-48h`;

        return msg;
    }
}

export const reservationService = new ReservationService();