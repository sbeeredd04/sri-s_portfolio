"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { bookArtwork } from "../../json/official-artwork.mjs";

const chapters = [
  {
    name: "Making things",
    title: "The little details are the big thing.",
    paragraphs: [
      "I care about a natural transition, an intuitive interaction, the moment a complicated idea becomes simple. I love engineering, but I also love the people, design, and business behind a good product.",
      "I’m drawn to entrepreneurship because making something useful takes more than getting the code to work. I like talking through an idea, trying it, and seeing what people actually do with it.",
      "My desk has three monitors. There’s usually a project in progress, music or a sitcom in the background, and another idea waiting its turn.",
    ],
  },
  {
    name: "Outside the screen",
    title: "I’m in for one more.",
    paragraphs: [
      "I dance, play badminton and basketball, and recently picked up volleyball. I love hiking, hanging out, exploring new cities, and finding a new hobby to get into.",
      "Hyderabad has a special place in my world. I love the food—especially the biryani. For me, it’s the best.",
      "I love photography, too. I’ve been taking photographs over the years, and I’m looking forward to sharing that side of me here—a collection through my own lens.",
      "My comfort-show rotation: The Big Bang Theory, Brooklyn Nine-Nine, Friends, The Fresh Prince of Bel-Air, and How I Met Your Mother. Familiar voices while I work, or a good way to unwind.",
      "There’s a lot of Fred again.. on repeat lately, with Tollywood always in the mix. I’ve tried producing music, too—the track in the listening room is one I made.",
    ],
  },
  {
    name: "What’s next",
    title: "Leave room for a new obsession.",
    paragraphs: [
      "I’m curious about new places and new things to make. I’d love to visit the California places behind the macOS names: Sequoia, Sonoma, Catalina. A very me way of planning a trip.",
      "I’m getting into creating content, too. Still finding the format, but excited to share more of what I make. The writing room is here for that next chapter.",
    ],
  },
];

// Three stops, each with a stamp drawn from what Sri has said about it.
const route = [
  {
    id: "hyderabad",
    place: "Hyderabad",
    region: "India",
    note: "A special place in my world. The biryani is the best.",
    stamp: (
      <>
        <path d="M18 70V34M62 70V34M14 34h8M58 34h8M16 34l2-8 2 8M60 34l2-8 2 8" />
        <path d="M22 70V46h36v24M30 70V56a10 10 0 0 1 20 0v14M22 46l18-10 18 10" />
        <path d="M8 70h64" />
      </>
    ),
  },
  {
    id: "tempe",
    place: "ASU",
    region: "Tempe",
    note: "Computer science, an entrepreneurship certificate, a 4.0.",
    stamp: (
      <>
        <path d="M6 68c10-16 20-26 30-26s22 12 38 26" />
        <path d="M34 50l6-14 6 14M36 45h8" />
        <circle cx="58" cy="20" r="7" />
        <path d="M6 68h68" />
      </>
    ),
  },
  {
    id: "sf",
    place: "San Francisco",
    region: "Now",
    note: "Founding Engineer at Offseason, downtown.",
    stamp: (
      <>
        <path d="M24 70V14M50 70V14M20 24h34M20 40h34" />
        <path d="M4 44c8 0 14-22 20-30M24 14c10 20 16 30 26 0M50 14c6 8 12 30 26 30" />
        <path d="M4 58h72" />
        <path d="M4 66c6-3 10-3 16 0s10 3 16 0 10-3 16 0 10 3 16 0" />
      </>
    ),
  },
];

function RouteStrip() {
  const [active, setActive] = useState("sf");
  const stop = route.find((r) => r.id === active);
  return (
    <div className="aj-route" aria-label="Where I’ve been">
      <ol>
        {route.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              aria-pressed={active === r.id}
              onClick={() => setActive(r.id)}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setActive(r.id);
              }}
              onFocus={() => setActive(r.id)}
            >
              <small>{r.region}</small>
              <span>{r.place}</span>
            </button>
            {i < route.length - 1 && (
              <svg
                className="aj-route-line"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 12 C 30 2, 60 20, 98 8" />
              </svg>
            )}
          </li>
        ))}
      </ol>
      <div className="aj-stamp" key={stop.id} aria-live="polite">
        <svg viewBox="0 0 80 80" aria-hidden="true">
          {stop.stamp}
        </svg>
        <p>{stop.note}</p>
      </div>
    </div>
  );
}

function ChapterTabs({ active, onChange, panelId }) {
  const refs = useRef([]);
  const move = (e, i) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      e.key
    ];
    let next = null;
    if (step) next = (i + step + chapters.length) % chapters.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = chapters.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  };
  return (
    <div
      className="aj-tabs"
      role="tablist"
      aria-label="Explore a little more about Sri"
    >
      {chapters.map((entry, i) => (
        <button
          key={entry.name}
          ref={(el) => (refs.current[i] = el)}
          role="tab"
          id={`${panelId}-tab-${i}`}
          aria-selected={active === i}
          aria-controls={panelId}
          tabIndex={active === i ? 0 : -1}
          onClick={() => onChange(i)}
          onKeyDown={(e) => move(e, i)}
        >
          <small>0{i + 1}</small>
          {entry.name}
        </button>
      ))}
    </div>
  );
}

function Chapter({ entry, index }) {
  return (
    <section className="aj-page">
      <div className="aj-margin" aria-hidden="true">
        <strong>0{index + 1}</strong>
        <span>{entry.name}</span>
      </div>
      <div className="aj-page-body">
        <h3>{entry.title}</h3>
        {entry.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {index === 0 && (
          <div className="aj-desk">
            <blockquote className="aj-principle">
              <p>“Innovators innovate, customers validate.”</p>
              <footer>
                From my original about page. Build an idea, put it in people’s
                hands, and listen.
              </footer>
            </blockquote>
            <a
              className="aj-book"
              href={bookArtwork.url}
              target="_blank"
              rel="noreferrer"
            >
              <Image
                src={bookArtwork.src}
                alt="Steve Jobs by Walter Isaacson — official book cover, photograph by Albert Watson"
                width={1024}
                height={1559}
                sizes="88px"
              />
              <span>
                <small>On my desk</small>
                <strong>Steve Jobs</strong>
                <span>Walter Isaacson</span>
                <span className="aj-book-note">
                  Currently reading. I keep coming back to the care behind the
                  things we make.
                </span>
                <span className="aj-book-link">
                  The book <span aria-hidden="true">↗</span>
                </span>
              </span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AboutJournal({ expanded = false }) {
  const [chapter, setChapter] = useState(0);
  const panelId = useId();
  return (
    <div className="about-journal aj">
      <header className="aj-intro">
        <div className="aj-intro-copy">
          <p className="eyebrow">Sri Ujjwal Reddy · a work in progress</p>
          <h2>
            Always <em>a little curious.</em>
          </h2>
          <p className="aj-lead">
            Hey, I’m Sri. I like making things, figuring things out, and paying
            attention to how it all feels.
          </p>
        </div>
        <figure className="aj-photo">
          <Image
            src="/aboutMe/DSC00409.JPG"
            alt="Sri working at a laptop during a student event"
            width={1200}
            height={800}
            sizes="(max-width: 700px) 86vw, 460px"
            loading="eager"
            fetchPriority="high"
          />
          <figcaption>
            Some of my favorite ideas start with people in the same room.
          </figcaption>
        </figure>
      </header>
      <RouteStrip />
      <section className="aj-now" aria-label="Where I am now">
        <span className="eyebrow">Right now</span>
        <div>
          <h3>Building from the beginning.</h3>
          <p>
            I’m a Founding Engineer at <strong>Offseason</strong>, building an
            AI agent for personal wellness in downtown San Francisco. I recently
            graduated from ASU with a <strong>4.0 GPA</strong> and an
            entrepreneurship certificate.
          </p>
        </div>
      </section>
      {expanded ? (
        <div className="aj-notebook aj-notebook-open">
          {chapters.map((entry, i) => (
            <Chapter entry={entry} index={i} key={entry.name} />
          ))}
        </div>
      ) : (
        <div className="aj-notebook">
          <ChapterTabs
            active={chapter}
            onChange={setChapter}
            panelId={panelId}
          />
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`${panelId}-tab-${chapter}`}
            tabIndex={0}
            className="aj-sheet"
            key={chapter}
          >
            <Chapter entry={chapters[chapter]} index={chapter} />
          </div>
        </div>
      )}
    </div>
  );
}
