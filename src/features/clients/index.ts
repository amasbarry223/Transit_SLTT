export type { Client, ClientInput, ClientType, ClientPrintRow } from "./types";
export { clientInputSchema, CLIENT_TYPES as CLIENT_INPUT_TYPES } from "./schemas/client-schema";
export { clientService } from "./services/client-service";
export { mapClientFromDb } from "./services/client-mapper";
export { printClients } from "./services/client-print";
export {
  ClientsScreen,
  ClientFicheScreen,
  ClientsTable,
  ClientFormFields,
  emptyClientForm,
  QuickClientButton,
  CLIENT_TYPES,
  SORT_OPTIONS,
  type ClientSortKey,
  type ClientTypeFilter,
} from "./components";
