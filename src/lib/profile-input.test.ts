import { describe, expect, test } from "vitest";
import { avatarPublicUrl, parseProfileInput, validateAvatar } from "@/lib/profile-input";

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
    expect(avatarPublicUrl(`${UUID}/1732000000.png`, "https://x.supabase.co")).toBe(
      `https://x.supabase.co/storage/v1/object/public/avatars/${UUID}/1732000000.png`,
    );
    expect(avatarPublicUrl("https://evil.com/a.png", "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl("../x.png", "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl(`${UUID}/a.svg`, "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl(null, "https://x.supabase.co")).toBeNull();
  });
});
