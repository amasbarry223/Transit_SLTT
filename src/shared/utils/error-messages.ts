import { UI } from "@/shared/utils/ui-messages";

/** Codes Supabase Auth → messages utilisateur en français. */
const AUTH_ERROR_MAP: Record<string, string> = {
  invalid_credentials:
    "L'adresse e-mail ou le mot de passe est incorrect. Vérifiez vos identifiants et réessayez.",
  invalid_grant:
    "L'adresse e-mail ou le mot de passe est incorrect. Vérifiez vos identifiants et réessayez.",
  email_not_confirmed:
    "Votre adresse e-mail n'est pas encore confirmée. Consultez votre boîte mail.",
  user_not_found:
    "Aucun compte n'est associé à cette adresse e-mail. Vérifiez l'adresse ou contactez un administrateur.",
  session_not_found:
    "Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer.",
  refresh_token_not_found:
    "Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer.",
  over_request_rate_limit:
    "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  user_already_exists:
    "Cette adresse e-mail est déjà associée à un compte. Connectez-vous ou utilisez une autre adresse.",
  weak_password:
    "Le mot de passe est trop faible. Utilisez au moins 8 caractères avec lettres et chiffres.",
  same_password:
    "Le nouveau mot de passe doit être différent de l'actuel.",
};

/** Messages bruts Supabase/Postgres (EN) → français. */
const RAW_MESSAGE_MAP: Record<string, string> = {
  "Invalid login credentials":
    "L'adresse e-mail ou le mot de passe est incorrect. Vérifiez vos identifiants et réessayez.",
  "Email not confirmed":
    "Votre adresse e-mail n'est pas encore confirmée. Consultez votre boîte mail.",
  "JWT expired":
    "Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer.",
  "Network request failed":
    "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
  "Failed to fetch":
    "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
};

/** Codes Postgres → messages utilisateur. */
const PG_ERROR_MAP: Record<string, string> = {
  "23505": "Cette information existe déjà. Modifiez la valeur ou utilisez une autre entrée.",
  "23503":
    "Impossible de supprimer cet élément : il est encore utilisé ailleurs dans l'application.",
  "42501": UI.errors.permission,
  "PGRST116": UI.errors.notFound,
  "PGRST301": UI.errors.permission,
};

function extractErrorCode(e: unknown): string | undefined {
  if (!e || typeof e !== "object") return undefined;
  const obj = e as Record<string, unknown>;
  if (typeof obj.code === "string") return obj.code;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.status === "number") return String(obj.status);
  return undefined;
}

function extractErrorMessage(e: unknown): string | undefined {
  if (typeof e === "string" && e.trim()) return e.trim();
  if (e instanceof Error && e.message.trim()) return e.message.trim();
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return undefined;
}

/**
 * Convertit une erreur technique en message compréhensible pour l'utilisateur.
 * Ne remonte jamais de message brut non mappé (sauf message déjà en français explicite).
 */
export function mapErrorToUserMessage(
  e: unknown,
  fallback: string = UI.errors.generic,
): string {
  const code = extractErrorCode(e);
  const rawMessage = extractErrorMessage(e);

  if (code && AUTH_ERROR_MAP[code]) return AUTH_ERROR_MAP[code];
  if (code && PG_ERROR_MAP[code]) return PG_ERROR_MAP[code];

  if (rawMessage) {
    if (RAW_MESSAGE_MAP[rawMessage]) return RAW_MESSAGE_MAP[rawMessage];
    for (const [key, value] of Object.entries(RAW_MESSAGE_MAP)) {
      if (rawMessage.includes(key)) return value;
    }
    for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
      if (rawMessage.toLowerCase().includes(key.replace(/_/g, " "))) return value;
    }
    // Message déjà en français orienté utilisateur (contient accents ou mots métier)
    if (
      /[àâäéèêëïîôùûüç]/i.test(rawMessage) ||
      /impossible|obligatoire|introuvable|vérifiez|réessayez/i.test(rawMessage)
    ) {
      return rawMessage;
    }
  }

  if (code === "401" || code === "403") return UI.errors.session;
  if (code === "500" || code === "502" || code === "503") return UI.errors.generic;

  return fallback;
}
