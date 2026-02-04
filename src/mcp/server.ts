/**
 * Serveur MCP principal
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.js';
import {
  checkAvailabilitySchema, checkAvailabilityDescription, handleCheckAvailability,
  listRoomTypesDescription, handleListRoomTypes,
  getRoomDetailsSchema, getRoomDetailsDescription, handleGetRoomDetails,
  createReservationSchema, createReservationDescription, handleCreateReservation,
  searchClientsSchema, searchClientsDescription, handleSearchClients,
  createRestaurantSaleSchema, createRestaurantSaleDescription, handleCreateRestaurantSale,
  createServiceRequestSchema, createServiceRequestDescription, handleCreateServiceRequest,
  getHousekeepingStatusSchema, getHousekeepingStatusDescription, handleGetHousekeepingStatus,
  getSalesReportSchema, getSalesReportDescription, handleGetSalesReport
} from './tools/index.js';

const logger = new Logger('McpServer');

export function createMcpServer(): McpServer {
  logger.info('Initialisation du serveur MCP...');

  const server = new McpServer({
    name: 'mcp-thais-xeko',
    version: '1.0.0',
  });

  // Tool 1: Check Availability
  server.registerTool(      
    'thais_check_availability',
    {
      description: checkAvailabilityDescription,
      inputSchema: checkAvailabilitySchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_check_availability', params);
      return handleCheckAvailability(params as any);
    }
  );

  // Tool 2: List Room Types
  server.registerTool(
    'thais_list_room_types',
    {
      description: listRoomTypesDescription,
      inputSchema: {},
    },
    async () => {
      logger.info('Tool: thais_list_room_types');
      return handleListRoomTypes();
    }
  );

  // Tool 3: Get Room Details
  server.registerTool(
    'thais_get_room_details',
    {
      description: getRoomDetailsDescription,
      inputSchema: getRoomDetailsSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_get_room_details', params);
      return handleGetRoomDetails(params as any);
    }
  );

  // Tool 4: Create Reservation
  server.registerTool(
    'thais_create_e_reservation',
    {
      description: createReservationDescription,
      inputSchema: createReservationSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_create_e_reservation', params);
      return handleCreateReservation(params as any);
    }
  );

  // Tool 5: Search Clients
  server.registerTool(
    'thais_search_clients',
    {
      description: searchClientsDescription,
      inputSchema: searchClientsSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_search_clients', params);
      return handleSearchClients(params as any);
    }
  );

  // Tool 6: Create Restaurant Sale
  server.registerTool(
    'thais_create_restaurant_sale',
    {
      description: createRestaurantSaleDescription,
      inputSchema: createRestaurantSaleSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_create_restaurant_sale', params);
      return handleCreateRestaurantSale(params as any);
    }
  );

  // Tool 7: Create Service Request  
  server.registerTool(
    'thais_create_service_request',
    {
      description: createServiceRequestDescription,
      inputSchema: createServiceRequestSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_create_service_request', params);
      return handleCreateServiceRequest(params as any);
    }
  );

  // Tool 8: Get Housekeeping Status
  server.registerTool(
    'thais_get_housekeeping_status',
    {
      description: getHousekeepingStatusDescription,
      inputSchema: getHousekeepingStatusSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_get_housekeeping_status', params);
      return handleGetHousekeepingStatus(params as any);
    }
  );

  // Tool 9: Get Sales Report
  server.registerTool(
    'thais_get_sales_report',
    {
      description: getSalesReportDescription,
      inputSchema: getSalesReportSchema.shape,
    },
    async (params) => {
      logger.info('Tool: thais_get_sales_report', params);
      return handleGetSalesReport(params as any);
    }
  );

  logger.success('9 tools MCP enregistrés');
  return server;
}