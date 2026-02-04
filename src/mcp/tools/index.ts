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