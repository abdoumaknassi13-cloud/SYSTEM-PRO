/**
 * TASK-01 UI foundation: brand tokens only.
 * No components, no business logic. Component primitives arrive in later tasks.
 * SECURITY: tokens are static data; nothing secret belongs here.
 */
export const SYSTEM_PRO_BRAND = {
  name: "SYSTEM PRO",
  primary: "#16A34A",
  background: "#FFFFFF",
  text: "#1A1A1A",
} as const;

export type SystemProBrand = typeof SYSTEM_PRO_BRAND;
