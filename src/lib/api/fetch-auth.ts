export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Les tokens vivent désormais en cookies httpOnly (posés par NestJS, jamais
  // lisibles en JS) : plus rien à lire ni à attacher manuellement en
  // Authorization — le navigateur envoie déjà les cookies sur cet appel
  // same-origin vers les routes /api/... de Next.js. `credentials: "include"`
  // reste explicite plutôt qu'implicite (défaut "same-origin" du fetch natif).
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  return response;
}
