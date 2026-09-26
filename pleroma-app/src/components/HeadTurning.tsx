// The movement, shown before the camera opens (like Face ID's intro): a head
// that looks straight, turns one way, then the other, while the ring fills.
export function HeadTurning() {
  return (
    <svg className="head" viewBox="0 0 120 120" aria-hidden>
      <g className="head__ring">
        {Array.from({ length: 48 }, (_, i) => {
          const a = ((i / 48) * 360 - 90) * (Math.PI / 180);
          return <line key={i} x1={60 + 50 * Math.cos(a)} y1={60 + 50 * Math.sin(a)} x2={60 + 55 * Math.cos(a)} y2={60 + 55 * Math.sin(a)} style={{ animationDelay: `${(i / 48) * 3}s` }} />;
        })}
      </g>
      <g className="head__face">
        <ellipse cx="60" cy="62" rx="24" ry="30" className="head__skin" />
        <path d="M36 52 Q38 28 60 28 Q82 28 84 52 Q78 40 60 40 Q42 40 36 52Z" className="head__hair" />
        <g className="head__features">
          <circle cx="51" cy="60" r="2" /><circle cx="69" cy="60" r="2" />
          <path d="M60 62 L57 72 L61 72" />
        </g>
      </g>
    </svg>
  );
}

