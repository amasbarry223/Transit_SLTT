/**
 * Thème Univer calqué sur le vert Microsoft Excel (#217346).
 * Basé sur greenTheme officiel, primary remappé.
 */
import type { Theme } from "@univerjs/presets";
import { greenTheme } from "@univerjs/presets";

export const EXCEL_GREEN = "#217346";
export const EXCEL_GREEN_DARK = "#185C37";
export const EXCEL_GREEN_LIGHT = "#2E8B57";

export const excelTheme: Theme = {
  ...greenTheme,
  primary: {
    50: "#E8F5EE",
    100: "#C6E7D4",
    200: "#9AD4B5",
    300: "#6ABB91",
    400: "#3D9A6A",
    500: EXCEL_GREEN,
    600: EXCEL_GREEN_DARK,
    700: "#154A2D",
    800: "#0F3822",
    900: "#0A2818",
  },
};
