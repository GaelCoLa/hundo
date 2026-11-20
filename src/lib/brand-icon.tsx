// Dibujo del ícono de Hundo (el cuadrado amarillo con "100"), compartido por
// el ícono de la pestaña (icon.tsx) y el de iPhone/iPad (apple-icon.tsx).
// ImageResponse convierte este JSX en una imagen PNG al compilar.
export function BrandIcon({ size, rounded }: { size: number; rounded: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffc94a",
        // En la pestaña, esquinas redondeadas como el logo; iOS redondea solo.
        borderRadius: rounded ? size * 0.22 : 0,
        color: "#0f1424",
        fontSize: size * 0.44,
        letterSpacing: -size * 0.03,
        // La fuente que trae ImageResponse no tiene versión "black" (900): se
        // engrosa el trazo repitiendo el texto apenas corrido en cada dirección.
        textShadow: [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
          .map(([x, y]) => `${x * size * 0.018}px ${y * size * 0.018}px 0 #0f1424`)
          .join(", "),
      }}
    >
      100
    </div>
  );
}
