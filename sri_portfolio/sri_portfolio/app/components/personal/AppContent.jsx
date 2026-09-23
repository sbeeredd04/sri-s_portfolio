"use client";
import DiscoveryRoom from "./DiscoveryRoom";
import AboutJournal from "./AboutJournal";
import ProjectLibrary from "./ProjectLibrary";
import EntertainmentLibrary from "./EntertainmentLibrary";
import Connections from "./Connections";
import WritingRoom from "./WritingRoom";
import ExperienceStory from "./ExperienceStory";
import OutdoorJournal from "./OutdoorJournal";
import { toolkit } from "../../json/personal";
export default function AppContent({
  id,
  expanded = false,
  collection = "all",
  channel,
  onChannelChange,
  onSoundRoomChange,
  onProjectLocationChange,
}) {
  if (id === "about") return <AboutJournal expanded={expanded} />;
  if (id === "work")
    return (
      <ProjectLibrary
        initialCollection={collection}
        onLocationChange={onProjectLocationChange}
      />
    );
  if (id === "journey") return <ExperienceStory expanded={expanded} />;
  if (id === "skills")
    return (
      <div>
        <p className="eyebrow">TOOLS ARE A WAY TO GET THERE</p>
        <h2>Whatever the idea needs.</h2>
        <p className="app-lead">
          I work across interfaces, AI, and the systems behind them. I like
          learning the tool that makes the idea possible.
        </p>
        {toolkit.map((g) => (
          <section className="toolkit-group" key={g.title}>
            <h3>{g.title}</h3>
            <div>
              {g.items.map((i) => (
                <span key={i}>{i}</span>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  if (id === "music")
    return (
      <EntertainmentLibrary
        onSoundRoomChange={onSoundRoomChange}
        expanded={expanded}
        initialSection={collection}
        channel={channel}
        onChannelChange={onChannelChange}
      />
    );
  if (id === "socials") return <Connections />;
  if (id === "discoveries") return <DiscoveryRoom />;
  if (id === "contact") return <Connections collaboration />;
  if (id === "writing") return <WritingRoom />;
  if (id === "notes") return <OutdoorJournal />;
  return null;
}
