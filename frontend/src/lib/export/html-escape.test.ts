import { describe, expect, it } from "vitest";
import { htmlEscape } from "./html-escape";

describe("htmlEscape", () => {
  it("échappe les 5 caractères HTML spéciaux", () => {
    expect(htmlEscape(`<script>alert("x")</script> & 'test'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;test&#39;",
    );
  });

  it("échappe & avant les autres caractères (pas de double-échappement)", () => {
    expect(htmlEscape("<div>")).toBe("&lt;div&gt;");
    expect(htmlEscape("&lt;")).toBe("&amp;lt;");
  });

  it("retourne une chaîne vide pour null/undefined plutôt que 'null'/'undefined'", () => {
    expect(htmlEscape(null)).toBe("");
    expect(htmlEscape(undefined)).toBe("");
  });

  it("convertit les valeurs non-string (nombre, booléen) en texte", () => {
    expect(htmlEscape(42)).toBe("42");
    expect(htmlEscape(true)).toBe("true");
  });

  it("laisse intact un texte sans caractère spécial", () => {
    expect(htmlEscape("Société Transit SLTT")).toBe("Société Transit SLTT");
  });
});
