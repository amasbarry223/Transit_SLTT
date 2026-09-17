import { describe, expect, it } from "vitest";
import { mapErrorToUserMessage } from "./error-messages";

describe("mapErrorToUserMessage — 401/403 ne renvoient jamais le message brut du backend", () => {
  it('traduit un 403 NestJS par défaut ("Forbidden resource") au lieu de l\'afficher tel quel', () => {
    const message = mapErrorToUserMessage({ status: 403, data: { message: "Forbidden resource" } });

    expect(message).not.toBe("Forbidden resource");
    expect(message).toMatch(/droits/i);
  });

  it('traduit un 401 non reconnu ("Unauthorized") au lieu de l\'afficher tel quel', () => {
    const message = mapErrorToUserMessage({ status: 401, data: { message: "Unauthorized" } });

    expect(message).not.toBe("Unauthorized");
    expect(message).toMatch(/session/i);
  });

  it("laisse passer un message 403 déjà en français orienté utilisateur", () => {
    const message = mapErrorToUserMessage({
      status: 403,
      data: { message: "Vous n'avez pas les droits pour effectuer cette action." },
    });

    expect(message).toMatch(/droits/i);
  });
});
