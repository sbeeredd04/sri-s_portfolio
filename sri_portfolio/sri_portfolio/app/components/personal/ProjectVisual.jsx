import { hackathonArt } from "../../lib/hackathon-art.mjs";
export default function ProjectVisual({ id }) {
  const art = hackathonArt[id];
  if (art)
    return (
      <div className="project-visual visual-hackathon" aria-hidden="true">
        <span className="visual-caption">{art.caption}</span>
        <svg viewBox="0 0 600 205" fill="none">
          {art.paths.map(({ d, fill, stroke, width = 2, dash }, i) => (
            <path
              key={i}
              d={d}
              fill={fill || "none"}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray={dash?.join(" ")}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {art.dots.map(([cx, cy, r, fill], i) => (
            <circle key={i} {...{ cx, cy, r, fill }} />
          ))}
        </svg>
      </div>
    );
  const kind = {
    aether: "branch",
    agentex: "resume",
    gitcue: "commit",
    mesa: "book",
    csdna: "microscopy",
    soda: "community",
    aatram: "momentum",
    simsim: "photos",
  }[id];
  if (!kind) return null;
  return (
    <div className={`project-visual visual-${kind}`} aria-hidden="true">
      <span className="visual-caption">
        {
          {
            branch: "FOLLOW A THOUGHT",
            resume: "A LITTLE MORE YOU",
            commit: "ONE LESS INTERRUPTION",
            book: "TURN THE PAGE",
            microscopy: "A DIFFERENT SCALE",
            community: "MADE TOGETHER",
            momentum: "KEEP A LITTLE MOMENTUM",
            photos: "FIND WHAT YOU MEAN",
          }[kind]
        }
      </span>
      <svg viewBox="0 0 600 205" fill="none">
        {kind === "branch" && (
          <>
            <path
              d="M160 130C250 130 230 65 340 65M160 130H340M160 130C250 130 245 190 340 190"
              stroke="#92aed2"
              strokeWidth="1.5"
            />
            {[
              [65, 103, 145, 52],
              [340, 39, 160, 52],
              [340, 105, 128, 48],
              [340, 168, 153, 35],
            ].map(([x, y, w, h], i) => (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="12"
                  fill="#b9d6fa12"
                  stroke="#d3e4fa35"
                />
                <circle
                  cx={x + 19}
                  cy={y + 18}
                  r="4"
                  fill={i === 0 ? "#c4b2e5" : "#a7cddf"}
                />
                <path
                  d={`M${x + 33} ${y + 18}h${w - 56}`}
                  stroke="#b3c9e388"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </>
        )}
        {kind === "resume" && (
          <>
            {[0, 1].map((i) => (
              <g
                key={i}
                transform={`translate(${135 + i * 172} ${50 - i * 12}) rotate(${i ? 5 : -5})`}
              >
                <rect
                  width="122"
                  height="165"
                  rx="8"
                  fill={i ? "#b7d9ca28" : "#dce6f21a"}
                  stroke="#ccdded44"
                />
                <circle cx="27" cy="30" r="10" fill="#bdd5d259" />
                <path
                  d="M48 25h46M48 35h28M20 64h80M20 78h68M20 108h80M20 122h55M20 136h70"
                  stroke="#c5d6e477"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </>
        )}
        {kind === "commit" && (
          <>
            <rect
              x="126"
              y="45"
              width="346"
              height="145"
              rx="15"
              fill="#94b2de11"
              stroke="#b3d0ed2c"
            />
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={145 + i * 12}
                cy="62"
                r="2.5"
                fill="#b3c6dc66"
              />
            ))}
            <path
              d="M157 96h45M220 96h115M157 123h80M255 123h180M157 149h38M215 149h115"
              stroke="#a4cdbb"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="421"
              cy="164"
              r="22"
              fill="#263d40"
              stroke="#b2ddc455"
            />
            <path
              d="m412 164 6 6 12-13"
              stroke="#bbebce"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}
        {kind === "book" && (
          <>
            <path
              d="M111 71c66-24 123-15 189 12v112c-66-27-123-36-189-12V71Zm378 0c-66-24-123-15-189 12v112c66-27 123-36 189-12V71Z"
              fill="#c4b09522"
              stroke="#d1bfa666"
            />
            <path
              d="M139 100c49-15 89-5 131 11m-131 12c49-15 89-5 131 11m60-22c44-15 84-25 131-11m-131 34c44-15 84-25 131-11"
              stroke="#ccbea366"
              strokeWidth="2"
            />
            <path d="M300 83v112" stroke="#ecd8b766" />
          </>
        )}
        {kind === "microscopy" && (
          <>
            {Array.from({ length: 60 }, (_, i) => (
              <circle
                key={i}
                cx={170 + ((i * 73) % 280)}
                cy={40 + ((i * 37) % 150)}
                r={1.5 + (i % 3)}
                fill={i % 3 === 0 ? "#bfa0d9" : "#97d4d5"}
                opacity={0.3 + (i % 5) * 0.12}
              />
            ))}
            <circle cx="304" cy="120" r="68" stroke="#c7e8ef55" />
            <path
              d="m355 166 42 30"
              stroke="#c7e8ef55"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </>
        )}
        {kind === "community" && (
          <>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6,
                // Round SVG coordinates so Node and browser trig precision
                // cannot produce different hydration attributes on /story.
                x = Number((300 + Math.cos(a) * 110).toFixed(3)),
                y = Number((120 + Math.sin(a) * 63).toFixed(3));
              return (
                <g key={i}>
                  <path d={`M300 120L${x} ${y}`} stroke="#b3a3d33a" />
                  <circle
                    cx={x}
                    cy={y}
                    r={i % 2 ? 9 : 13}
                    fill="#b7a4dc35"
                    stroke="#c6b5e66a"
                  />
                </g>
              );
            })}
            <circle
              cx="300"
              cy="120"
              r="25"
              fill="#c7bbe833"
              stroke="#c7bbe88a"
            />
          </>
        )}
        {kind === "momentum" && (
          <>
            <path d="M100 180H500M100 120H500M100 60H500" stroke="#c4d8e214" />
            <path
              d="M100 171C155 165 167 127 207 130S264 154 298 116 347 117 382 88 454 81 500 51"
              stroke="#a7d8be"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="382" cy="88" r="7" fill="#c4f0d8" />
          </>
        )}
        {kind === "photos" && (
          <>
            {Array.from({ length: 8 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${130 + (i % 4) * 88} ${60 + Math.floor(i / 4) * 70})`}
              >
                <rect
                  width="76"
                  height="57"
                  rx="7"
                  fill={i % 2 ? "#739b9670" : "#809bb070"}
                />
                <path d="m0 48 25-30 16 13 16-10 19 27" fill="#b5ccdb38" />
                <circle cx="57" cy="13" r="5" fill="#dddae057" />
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
