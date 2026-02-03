/**
 * Types communs utilisés dans toute l'application
 */

export interface AvailabilitySearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

export interface NormalizedAvailabilityParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nbNights: number;
}

export interface CreateReservationParams {
  checkIn: string;
  checkOut: string;
  roomTypeId: number;
  rateId: number;
  adults: number;
  children?: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
}

export interface FormattedAvailability {
  roomTypeName: string;
  roomTypeId: number;
  capacity: string;
  totalPrice: number;
  pricePerNight: number;
  rateName: string;
  description?: string;
}

export interface FormattedRoomType {
  id: number;
  name: string;
  capacity: string;
  description?: string;
  pictureCount: number;
}