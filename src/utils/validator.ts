/**
 *  Validateur avec messages d'erreur clairs et suggestions
 */

import { DateParser, dateParser } from "./date-parser.js";
import type { NormalizedAvailabilityParams } from "../types/common.types.js";

export class Validator {
    validateAndNormalizeAvailability(params: {
        checkIn: string;
        checkOut: string;
        adults: number;
        children?: number;
    }): NormalizedAvailabilityParams {
        const checkIn = dateParser.parse(params.checkIn);
        const checkOut = dateParser.parse(params.checkOut);

        if (!DateParser.isValidDate(checkIn)) {
            throw new Error(
                `Date d'arrivée invalide : "${params.checkIn}"\n` +
                `Formats acceptés : YYYY-MM-DD, "6 février", "début mars", "demain"`
            );
        }
        if (!DateParser.isValidDate(checkOut)) {
            throw new Error(
                `Date de départ invalide : "${params.checkOut}"\n` +
                `Formats acceptés : YYYY-MM-DD, "12 février", "fin mars", "dans une semaine"`
            );
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate <= checkInDate) {
            throw new Error(
                `La date de départ (${checkOut}) doit être après la date d'arrivée (${checkIn}).`
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkInDate < today) {
            throw new Error(`La date d'arrivée (${checkIn}) est dans le passé.`);
        }

        const nbNights = DateParser.calculateNights(checkIn, checkOut);
        if (nbNights > 30) {
            throw new Error(`Séjour trop long (${nbNights} nuits). Maximum 30 nuits.`);
        }

        let adults = Math.max(1, Math.min(10, params.adults));
        let children = Math.max(0, Math.min(10, params.children ?? 0));

        if (adults + children > 20) {
            throw new Error(`Trop de personnes (${adults + children}). Maximum 20.`);
        }

        return { checkIn, checkOut, adults, children, nbNights };
    }

    validateEmail(email: string): string {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error(`Email invalide : "${email}"`);
        }
        return email.toLowerCase().trim();
    }

    validatePhone(phone: string | undefined): string | undefined {
        if (!phone) return undefined;
        const cleaned = phone.replace(/[\s.\-()]/g, '');
        const phoneRegex = /^(\+33|0033|0)?[1-9]\d{8}$/;
        if (!phoneRegex.test(cleaned)) {
            throw new Error(`Téléphone invalide : "${phone}"`);
        }
        return cleaned;
    }

    validateName(name: string, fieldName: string): string {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            throw new Error(`${fieldName} trop court : "${name}"`);
        }
        if (trimmed.length > 50) {
            throw new Error(`${fieldName} trop long : "${name}"`);
        }
        return trimmed
            .split(/[\s-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }
}

export const validator = new Validator();