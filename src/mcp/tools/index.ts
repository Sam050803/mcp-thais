/**
 * Export de tous les tools
 */

export {
    checkAvailabilitySchema,
    checkAvailabilityDescription,
    handleCheckAvailability,
    type CheckAvailabilityParams,
} from './check-availability.js';

export {
    listRoomTypesDescription,
    handleListRoomTypes,
} from './list-room-types.js';

export {
    getRoomDetailsSchema,
    getRoomDetailsDescription,
    handleGetRoomDetails,
    type GetRoomDetailsParams,
} from './get-room-details.js';

export {
    createReservationSchema,
    createReservationDescription,
    handleCreateReservation,
    type CreateReservationParams,
} from './create-reservation.js';

export {
    searchClientsSchema,
    searchClientsDescription,
    handleSearchClients,
    type SearchClientsParams,
} from './search-clients.js';

export {
    createRestaurantSaleSchema,
    createRestaurantSaleDescription,
    handleCreateRestaurantSale,
    type CreateRestaurantSaleParams,
} from './create-restaurant-sale.js';

export {
    createServiceRequestSchema,
    createServiceRequestDescription,
    handleCreateServiceRequest,
    type CreateServiceRequestParams,
} from './create-service-request.js';

export {
    getHousekeepingStatusSchema,
    getHousekeepingStatusDescription,
    handleGetHousekeepingStatus,
    type GetHousekeepingStatusParams,
} from './get-housekeeping-status.js';

export {
    getSalesReportSchema,
    getSalesReportDescription,
    handleGetSalesReport,
    type GetSalesReportParams,
} from './get-sales-report.js';