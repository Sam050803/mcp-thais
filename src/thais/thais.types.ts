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

// Disponibilité brute par jour (endpoint /apr/availabilities/currents)
export interface AvailabilityRaw {
  id: number;
  date: string;
  room_type_id: number;
  availability: number;  // nombre de chambres disponibles
  source: string;
}

// Disponibilité formatée enrichie avec room type
export interface Availability {
  room_type_id: number;
  room_type?: RoomType;
  availableRooms: number;  // min de dispo sur la période
  dates: string[];         // dates concernées
}

export interface Customer {
  id?: number;
  lastname: string;
  firstname?: string;
  email: string;
  phone?: string;
}

export interface Client {
  id: number;
  lastname: string;
  firstname: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  address?: string;
  country?: string;
  satisfaction_rating?: number;
  warning?: boolean;
  last_booking_at?: string;
  customer_category?: {
    id: number;
    label: string;
  };
}

export interface ClientSearchParams {
  query?: string;
  email?: string;
  phone?: string;
  vip_only?: boolean;
  updated_since?: string;
  limit?: number;
}

export interface ClientSearchResult {
  clients: Client[];
  total: number;
}

// Réponse API réelle de POST /hub/api/partner/hotel/ebookings
export interface EReservation {
  id: number;
  booking_id: number;
  external_reference: string;
  ota_reference: string | null;
  checkin: string;
  checkout: string;
  created_at: string;
  customer_firstname: string;
  customer_lastname: string;
  customer_email: string;
  customer_phone: string;
  customer_country: string;
  channel_name: string;
  state: number;
  payment_amount: number;
  insurance_amount: number;
  booking_rooms: Array<{
    id: number;
    price: number;
    rate_id: number;
    room_type_id: number;
    booking_nb_persons: Record<string, number>;
    nb_persons: { adults: number; children: number; infants: number };
    daily_rates: Array<{ date: string; amount: number }>;
    room_type?: RoomType;
    rate?: Rate;
  }>;
}

// Format selon la doc API Thaïs pour POST /hub/api/partner/hotel/ebookings
export interface CreateEReservationRequest {
  checkin: string;           // format YYYY-MM-DD
  checkout: string;          // format YYYY-MM-DD
  customer_civility_id?: number;  // 1 = Mme & M.
  customer_firstname: string;
  customer_lastname: string;
  customer_email: string;
  customer_phone?: string;
  customer_mobile?: string;
  customer_zipcode?: string;
  customer_city?: string;
  customer_address?: string;
  customer_country?: string; // ISO2 ex: FR
  comment?: string;
  ota_reference?: string;
  channel_name?: string;     // ex: "Partner"
  payment_type?: string;     // ex: "CB"
  payment_amount?: number;
  insurance_amount?: number;
  booking_rooms: EReservationRoom[];
}

export interface EReservationRoom {
  room_type_id: number;
  rate_id?: number;
  price?: number;
  rooming?: string;          // nom du client
  nb_persons: {              // selon doc API Thaïs
    adults: number;
    children: number;
  };
}

// Types pour les ventes restaurant
export interface RestaurantSaleData {
  purchase_type: 'RESTAURANT_PURCHASE';
  room_no: string;
  label: string;
  description: string;
  amount: number;
  currency: string;
  payment_method: string;
  customer_notes?: string;
}

// Types pour les demandes de service
export interface ServiceRequestData {
  type: 'SERVICE_REQUEST';
  room_no: string;
  service_category: string;
  description: string;
  priority_level: number;
  customer_info?: string;
  status: string;
  created_at: string;
  requested_time?: string;
}

// Types pour le ménage
export interface HousekeepingStatusQuery {
  date: string;
  floor?: number;
  room_number?: string;
  status?: string;
}

// Types pour les analytics
export interface SalesDataQuery {
  start_date: string;
  end_date: string;
  include_categories?: boolean;
}

// Prix par nuit (endpoint /apr/prices/currents)
export interface PriceData {
  id: number;
  created_at: string;
  date: string;
  room_type_id: number;
  rate_id: number;
  price: number;
  children_price?: number;
  infants_price?: number;
  min_stay: number;
  max_stay?: number;
  coa: boolean;  // close on arrival
  cod: boolean;  // close on departure
  source: string;
  user: string;
  ack_at?: string;
  stop_sell: boolean;
  archived: boolean;
  room_type?: RoomType;
  rate?: Rate;
}