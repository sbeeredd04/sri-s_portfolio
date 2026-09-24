"use client";
import DiscoveryRoom from "./DiscoveryRoom";
import AboutJournal from "./AboutJournal";
import ProjectLibrary from "./ProjectLibrary";
import EntertainmentLibrary from "./EntertainmentLibrary";
import Connections from "./Connections";
import WritingRoom from "./WritingRoom";
import ExperienceStory from "./ExperienceStory";
import OutdoorJournal from "./OutdoorJournal";
import ToolkitPegboard from "./ToolkitPegboard";
export default function AppContent({
  id,
  expanded = false,
  collection = "all",
  channel,
  onChannelChange,
  onSoundRoomChange,
  onProjectLocationChange,
  projectPage,
}) {
  if (id === "about") return <AboutJournal expanded={expanded} />;
  if (id === "work")
    return (
      <ProjectLibrary
        initialCollection={collection}
        onLocationChange={onProjectLocationChange}
        compact={expanded}
      />
    );
  if (id === "journey")
    return <ExperienceStory expanded={expanded} projectPage={projectPage} />;
  if (id === "skills") return <ToolkitPegboard />;
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
