const INK = "currentColor";
const VERMILION = "#c04e34";
const MOSS = "#5f6e49";

function BuildArt() {
  return (
    <g
      fill="none"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M32 22h146v104H32Z" strokeWidth="3.5" />
      <path d="M105 22v104M32 74h146" />
      <path d="M20 126h170" strokeWidth="4.5" />
      <path
        d="M16 158h292l-20 64H36Z"
        fill={INK}
        fillOpacity="0.1"
        strokeWidth="3.5"
      />
      <path d="M54 158v64M270 158v64" stroke={MOSS} strokeWidth="3.5" />
      <path d="M196 70v34" strokeWidth="3.5" />
      <path d="M178 70h36" strokeWidth="3.5" />
      <path d="M176 98h40v16h-40Z" fill={INK} stroke="none" />
      <path d="M196 114v32" strokeWidth="3.5" />
      <path d="M214 182h58v24h-58Z" stroke={MOSS} strokeWidth="3.5" />
      <path d="M214 182v-24" stroke={MOSS} strokeWidth="3.5" />
      <path d="M70 198h74" stroke={VERMILION} strokeWidth="4.5" />
      <path d="M144 192l12 6-10 7Z" fill={VERMILION} stroke="none" />
      <circle cx="66" cy="48" r="8" fill={VERMILION} stroke="none" />
    </g>
  );
}

function NoticeArt() {
  return (
    <g
      fill="none"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse
        cx="168"
        cy="118"
        rx="112"
        ry="44"
        transform="rotate(-18 168 118)"
        strokeWidth="2.5"
      />
      <circle cx="262" cy="78" r="8" fill={VERMILION} stroke="none" />
      <path
        d="M58 126c34-48 108-50 146-4-38 44-112 46-146 4Z"
        strokeWidth="3.5"
      />
      <circle cx="130" cy="122" r="26" strokeWidth="3.25" />
      <circle cx="136" cy="122" r="10" fill={INK} stroke="none" />
      <path d="M156 116h48l24-34" strokeWidth="2.25" />
      <path d="M34 40h44M34 40v34" stroke={MOSS} strokeWidth="3.25" />
      <path d="M34 56h18" stroke={MOSS} strokeWidth="3" />
      <path d="M206 178h78M284 178v30" stroke={MOSS} strokeWidth="3.25" />
    </g>
  );
}

function WanderArt() {
  return (
    <g
      fill="none"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 148h292" strokeWidth="2.5" />
      <path
        d="M14 150c32-42 62-54 94-30 22 16 38 12 56-12 28-30 56-24 86 10 16 16 34 20 56 6v68H14Z"
        fill={INK}
        fillOpacity="0.1"
      />
      <path
        d="M14 150c32-42 62-54 94-30 22 16 38 12 56-12 28-30 56-24 86 10 16 16 34 20 56 6"
        strokeWidth="3.5"
      />
      <path
        d="M148 150c12 22 4 40-14 62"
        stroke={VERMILION}
        strokeWidth="3.5"
      />
      <path d="M186 62h88v52h-88Z" strokeWidth="3.5" />
      <path d="M206 62l8-16h40l8 16" />
      <circle cx="230" cy="88" r="14" />
      <circle cx="230" cy="88" r="5.5" fill={MOSS} stroke="none" />
      <path d="M260 80h12" stroke={VERMILION} strokeWidth="3.5" />
    </g>
  );
}

const ARTS = {
  build: BuildArt,
  notice: NoticeArt,
  wander: WanderArt,
};

export default function FieldnoteDoodle({ kind = "build", className, label }) {
  const named = typeof label === "string" && label.trim().length > 0;
  const Art = ARTS[kind] || BuildArt;
  return (
    <svg
      className={["fn-doodle", className].filter(Boolean).join(" ")}
      viewBox="0 0 320 240"
      fill="none"
      role={named ? "img" : undefined}
      aria-label={named ? label : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
    >
      <Art />
    </svg>
  );
}
