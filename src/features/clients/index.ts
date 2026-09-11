export type { Client, ClientInput, ClientType, ClientPrintRow } from "./types";
export { clientInputSchema } from "./schemas/client-schema";
export { clientService } from "./services/client-service";
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
