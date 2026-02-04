/**
 * Parser intelligent de dates en français
 * Permet de comprendre des formats variés comme : 
 *  - "6 février", "début mars", "dans une semaine"
 */

export class DateParser {
    private referenceDate: Date;

    constructor(referenceDate: Date = new Date()) {
        this.referenceDate = new Date(referenceDate);
        this.referenceDate.setHours(0, 0, 0, 0);
    }

    private static readonly MONTHS: Record<string, string> = {
        'janvier': '01', 'février': '02', 'fevrier': '02',
        'mars': '03', 'avril': '04', 'mai': '05',
        'juin': '06', 'juillet': '07', 'août': '08', 'aout': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11',
        'décembre': '12', 'decembre': '12',
    };

    parse(input: string): string {
        const cleaned = input.trim().toLowerCase();

        // Format ISO déjà valide
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
            return cleaned;
        }

        // Format français JJ/MM/AAAA
        const frenchDateMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (frenchDateMatch) {
            const [, day, month, year] = frenchDateMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // "6 février" ou "6 février 2026"
        const dayMonthMatch = cleaned.match(
            /^(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?$/
        );
        if (dayMonthMatch) {
            const [, day, monthName, yearStr] = dayMonthMatch;
            const month = DateParser.MONTHS[monthName];
            const year = yearStr || this.getSmartYear(parseInt(month));
            return `${year}-${month}-${day.padStart(2, '0')}`;
        }

        // "début février"
        const debutMatch = cleaned.match(
            /^d[ée]but\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?$/
        );
        if (debutMatch) {
            const [, monthName, yearStr] = debutMatch;
            const month = DateParser.MONTHS[monthName];
            const year = yearStr || this.getSmartYear(parseInt(month));
            return `${year}-${month}-01`;
        }

        // "mi-février"
        const midMatch = cleaned.match(
            /^mi[- ]?(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?$/
        );
        if (midMatch) {
            const [, monthName, yearStr] = midMatch;
            const month = DateParser.MONTHS[monthName];
            const year = yearStr || this.getSmartYear(parseInt(month));
            return `${year}-${month}-15`;
        }

        // "fin février"
        const finMatch = cleaned.match(
            /^fin\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?$/
        );
        if (finMatch) {
            const [, monthName, yearStr] = finMatch;
            const month = DateParser.MONTHS[monthName];
            const year = parseInt(yearStr || this.getSmartYear(parseInt(month)));
            const lastDay = new Date(year, parseInt(month), 0).getDate();
            return `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        }

        // "aujourd'hui"
        if (/^aujourd'?hui$/i.test(cleaned)) {
            return this.formatDate(this.referenceDate);
        }

        // "demain"
        if (/^demain$/i.test(cleaned)) {
            const tomorrow = new Date(this.referenceDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDate(tomorrow);
        }

        // "dans X jours/semaines"
        const dansMatch = cleaned.match(
            /^dans\s+(\d+|une?)\s+(jour|jours|semaine|semaines|mois)$/
        );
        if (dansMatch) {
            const [, quantityStr, unit] = dansMatch;
            const quantity = /^une?$/.test(quantityStr) ? 1 : parseInt(quantityStr);
            const future = new Date(this.referenceDate);

            if (unit.startsWith('jour')) {
                future.setDate(future.getDate() + quantity);
            } else if (unit.startsWith('semaine')) {
                future.setDate(future.getDate() + quantity * 7);
            } else if (unit === 'mois') {
                future.setMonth(future.getMonth() + quantity);
            }

            return this.formatDate(future);
        }

        return input;
    }

    private getSmartYear(month: number): string {
        const currentMonth = this.referenceDate.getMonth() + 1;
        const currentYear = this.referenceDate.getFullYear();
        if (month < currentMonth) {
            return String(currentYear + 1);
        }
        return String(currentYear);
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static calculateNights(checkIn: string, checkOut: string): number {
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const diffTime = endDate.getTime() - startDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    static isValidDate(dateStr: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date.getTime());
    }

    getYesterday(): string {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    formatFrench(dateStr: string): string {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
}

export const dateParser = new DateParser();