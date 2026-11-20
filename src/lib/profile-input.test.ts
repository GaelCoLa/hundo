import { describe, expect, test } from "vitest";
import { avatarPublicUrl, confirmMatches, parseProfileInput, sniffImageType, validateAvatar, validateFavorites } from "@/lib/profile-input";

const MB = 1024 * 1024;
const UUID = "0b5d6f2a-1c3e-4a7b-9d8e-123456789abc";

describe("parseProfileInput", () => {
  test("recorta espacios y deja null lo vacío", () => {
    expect(parseProfileInput({ displayName: "  Gael  ", bio: "" })).toEqual({ ok: true, value: { displayName: "Gael", bio: null } });
  });
  test("respeta los límites de la base (40 y 300)", () => {
    expect(parseProfileInput({ displayName: "x".repeat(41), bio: "" })).toEqual({ ok: false, error: "display_name_too_long" });
    expect(parseProfileInput({ displayName: "", bio: "x".repeat(301) })).toEqual({ ok: false, error: "bio_too_long" });
    expect(parseProfileInput({ displayName: "", bio: "x".repeat(300) }).ok).toBe(true);
  });
});

describe("validateAvatar", () => {
  test("PNG, JPEG o WebP de hasta 2 MB", () => {
    expect(validateAvatar({ size: 2 * MB, type: "image/png" })).toEqual({ ok: true, ext: "png" });
    expect(validateAvatar({ size: 1000, type: "image/jpeg" })).toEqual({ ok: true, ext: "jpg" });
    expect(validateAvatar({ size: 1000, type: "image/webp" })).toEqual({ ok: true, ext: "webp" });
  });
  test("rechaza archivos grandes, vacíos o de otro tipo", () => {
    expect(validateAvatar({ size: 2 * MB + 1, type: "image/png" })).toEqual({ ok: false, error: "avatar_too_big" });
    expect(validateAvatar({ size: 0, type: "image/png" })).toEqual({ ok: false, error: "avatar_empty" });
    for (const type of ["image/svg+xml", "application/octet-stream", "image/gif"]) {
      expect(validateAvatar({ size: 1000, type })).toEqual({ ok: false, error: "avatar_type" });
    }
  });
});

describe("avatarPublicUrl", () => {
  test("arma la URL pública solo para rutas propias del bucket", () => {
    expect(avatarPublicUrl(`${UUID}/1732000000.png`, UUID, "https://x.supabase.co")).toBe(
      `https://x.supabase.co/storage/v1/object/public/avatars/${UUID}/1732000000.png`,
    );
    expect(avatarPublicUrl("https://evil.com/a.png", UUID, "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl("../x.png", UUID, "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl(`${UUID}/a.svg`, UUID, "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl(null, UUID, "https://x.supabase.co")).toBeNull();
    // La carpeta tiene que ser la del dueño: nadie puede mostrar la foto de otro.
    expect(avatarPublicUrl(`${UUID}/1732000000.png`, "11111111-2222-4333-8444-555555555555", "https://x.supabase.co")).toBeNull();
  });
});

describe("validateFavorites", () => {
  const rated = new Set([1, 2, 3, 4, 5, 6]);
  test("mantiene el orden elegido y saltea los huecos", () => {
    expect(validateFavorites([3, 1, 2], rated)).toEqual({ ok: true, value: [3, 1, 2] });
    expect(validateFavorites([1, 0, 2, NaN], rated)).toEqual({ ok: true, value: [1, 2] });
    expect(validateFavorites([], rated)).toEqual({ ok: true, value: [] });
  });
  test("sin repetidos, máximo 5, solo juegos calificados", () => {
    expect(validateFavorites([1, 1], rated)).toEqual({ ok: false, error: "favorites_duplicate" });
    expect(validateFavorites([1, 2, 3, 4, 5, 6], rated)).toEqual({ ok: false, error: "favorites_too_many" });
    expect(validateFavorites([9], new Set([1]))).toEqual({ ok: false, error: "favorites_not_rated" });
  });
});

describe("confirmMatches", () => {
  test("hay que escribir el nombre de usuario exacto (sin importar mayúsculas ni espacios)", () => {
    expect(confirmMatches(" GaelCola ", "gaelcola")).toBe(true);
    expect(confirmMatches("gaelcol", "gaelcola")).toBe(false);
    expect(confirmMatches("", "gaelcola")).toBe(false);
  });
});

describe("sniffImageType", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...Array(12).fill(0)].slice(0, 12));
  test("reconoce PNG, JPEG y WebP por su firma (los primeros bytes del archivo)", () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpg");
    expect(sniffImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]))).toBe("webp");
  });
  test("un .exe o un SVG renombrados no pasan, aunque digan image/png", () => {
    expect(sniffImageType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull(); // "MZ": ejecutable de Windows
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns=\"h"))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});
