/**
 * Types pour l'API Thaïs
 * Correspondent aux réponses JSON de l'API
 */

export interface LoginResponse {
    token: string;
}

export interface RoomType {
  id: number;
  label: string;
  subject_to_pricing: boolean;
  nb_persons_min: number;
  nb_persons_max: number;
  public: boolean;
  color: string;
  description: string;
  rank: number;
  deleted: boolean;
  ical_url: string | null;
  pictures?: string[];
}

export interface Room {
  id: number;
  label: string;
  nb_persons_max: number;
  room_type_id: number;
  rank: number;
  stage: string;
  visible: boolean;
  room_type: RoomType;
}

export interface Rate {
  id: number;
  label: string;
  description: string;
  rate_per_person: boolean;
  nb_persons_min: number;
  nb_persons_max: number;
}

export interface Availability {
  id: number;
  room_type_id: number;
  label: string;
  price: number;
  price_per_night: number;
  nb_nights: number;
  rate_id: number;
  room_type: RoomType;
  rate: Rate;
}

export interface Customer {
  id?: number;
  lastname: string;
  firstname?: string;
  email: string;
  phone?: string;
}

export interface EReservation {
  id: number;
  reservation_number: string;
  check_in: string;
  check_out: string;
  nb_adults: number;
  nb_children: number;
  total_price: number;
  customer: Customer;
  room_type: RoomType;
  status: string;
}

export interface CreateEReservationRequest {
  check_in: string;
  check_out: string;
  room_type_id: number;
  rate_id: number;
  nb_adults: number;
  nb_children: number;
  customer: Customer;
}