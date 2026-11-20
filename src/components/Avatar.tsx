// Foto de perfil. Si el jugador no subió una (o la ruta guardada no es válida),
// muestra su inicial sobre el amarillo de la marca, como hasta ahora.
import Image from "next/image";
import { avatarPublicUrl } from "@/lib/profile-input";

type Props = {
  username: string;
  /** Id del dueño del perfil: la foto tiene que estar en SU carpeta. */
  ownerId: string;
  /** Ruta dentro del bucket "avatars" (profiles.avatar_url). */
  avatarPath: string | null;
  /** Lado en píxeles. */
  size: number;
  className?: string;
};

export function Avatar({ username, ownerId, avatarPath, size, className = "rounded-[14px]" }: Props) {
  const url = avatarPublicUrl(avatarPath, ownerId, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (url) {
    return <Image src={url} alt="" width={size} height={size} className={`shrink-0 object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-accent font-bold uppercase text-accent-ink ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {username[0]}
    </span>
  );
}
