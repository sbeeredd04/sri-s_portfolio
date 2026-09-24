"use client";
import Image from "next/image";
import { useId, useState } from "react";
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

export default function AboutJournal({ expanded = false }) {
  const [chapter, setChapter] = useState(0);
  const pageId = useId();
  return (
    <div className="about-journal">
      <header className="journal-intro">
        <div>
          <p className="eyebrow">SRI UJJWAL REDDY / A WORK IN PROGRESS</p>
          <h2>
            Always
            <br />
            <em>a little curious.</em>
          </h2>
          <p className="app-lead">
            Hey, I’m Sri. I like making things, figuring things out, and paying
            attention to how it all feels.
          </p>
          <p className="journal-role">
            Founding Engineer at Offseason · San Francisco
          </p>
          <span className="journal-route">
            Hyderabad, India <span>→</span> ASU <span>→</span> San Francisco
          </span>
        </div>
        <figure className="journal-photo">
          <Image
            src="/aboutMe/DSC00409.JPG"
            alt="Sri working at a laptop during a student event"
            width={1200}
            height={800}
            sizes="(max-width: 650px) 80vw, 440px"
          />
          <figcaption>
            Some of my favorite ideas start with people in the same room.
          </figcaption>
        </figure>
      </header>
      <section className="journal-now" aria-label="Where I am now">
        <span className="eyebrow">RIGHT NOW</span>
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
      {!expanded && (
        <div
          className="journal-tabs"
          role="group"
          aria-label="Explore a little more about Sri"
        >
          {chapters.map((entry, i) => (
            <button
              key={entry.name}
              aria-pressed={chapter === i}
              aria-controls={pageId}
              onClick={() => setChapter(i)}
            >
              <small>0{i + 1}</small>
              {entry.name}
            </button>
          ))}
        </div>
      )}
      <div id={pageId} aria-live={expanded ? undefined : "polite"}>
        {(expanded ? chapters : [chapters[chapter]]).map((entry, index) => (
          <section className="journal-chapter" key={entry.name}>
            <div className="journal-margin">
              <span>{entry.name}</span>
              <strong>0{(expanded ? index : chapter) + 1}</strong>
            </div>
            <div>
              <h3>{entry.title}</h3>
              {entry.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {entry === chapters[0] && (
                <blockquote className="journal-principle">
                  <span className="eyebrow">
                    A PRINCIPLE I KEEP COMING BACK TO
                  </span>
                  <p>“Innovators innovate, customers validate.”</p>
                  <footer>
                    From my original about page. Build an idea, put it in
                    people’s hands, and listen.
                  </footer>
                </blockquote>
              )}
              {entry === chapters[0] && (
                <a
                  className="journal-book"
                  href={bookArtwork.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={bookArtwork.src}
                    alt="Steve Jobs by Walter Isaacson — official book cover, photograph by Albert Watson"
                    width={1024}
                    height={1559}
                    sizes="96px"
                  />
                  <span>
                    <small>ON MY DESK</small>
                    <strong>Steve Jobs</strong>
                    <span>Walter Isaacson</span>
                    <p>
                      Currently reading. I keep coming back to the care behind
                      the things we make.
                    </p>
                    <span>The book ↗</span>
                  </span>
                </a>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
