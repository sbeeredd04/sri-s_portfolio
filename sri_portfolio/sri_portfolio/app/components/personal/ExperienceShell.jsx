"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import WalkingControls from "./WalkingControls";
import DiscoveryToast from "./DiscoveryToast";
import { discover } from "../../lib/discoveries.mjs";
import CommandBar from "./CommandBar";
import { COMMAND_EVENT } from "./command-events";
import PhysicsCursor from "./PhysicsCursor";
import ReadingSheet from "./ReadingSheet";
import PersonalSignature from "./PersonalSignature";
import SettingsPopover from "./SettingsPopover";
import ProjectExhibitControls from "./ProjectExhibitControls";
import { projectExhibits, exhibitStep } from "../../lib/project-exhibits.mjs";
import { workbenchNotebooks } from "../../lib/workbench-notebooks.mjs";
import useSoundscape from "./useSoundscape";
import SoundPreferences from "./SoundPreferences";
import useWorldTime from "./useWorldTime";
import useWeather from "./useWeather";
import { fallbackWeather, weatherLabel } from "../../lib/weather.mjs";
import { biomeMoods } from "../../lib/world-time.mjs";
import { linkedProjectId, projectId } from "../../lib/project-library.mjs";
import {
  chapters,
  allChapters,
  readingSections,
} from "../../lib/world-story.mjs";
import {
  streetRoutes,
  streetIndex,
  streetStop,
  streetRange,
} from "../../lib/street-view.mjs";
import { placeStops } from "../../lib/place-stops.mjs";
import { roomWorldDestination } from "../../lib/reading-rooms.mjs";
import { allProjects, shows } from "../../json/personal";
import WorldLoader from "./WorldLoader";
import { initialTier } from "./Quality";
function footEntry(biome, stop) {
  if (
    biome === "future" &&
    ["writing", "socials", "collaborate"].includes(stop)
  )
    return `roam:${stop}`;
  if (biome === "trail" && stop === "overlook") return "roam:overlook";
  if (biome === "projects" && (stop === "campus" || stop === "ring"))
    return `roam:${stop}`;
  return biome === "studio" && stop !== "bay" ? "roam:roof" : "roam";
}
const WorldScene = dynamic(() => import("./WorldScene"), {
  ssr: false,
  loading: () => null,
});
function clearProjectLink() {
  if (linkedProjectId(window.location.hash))
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
}

class WorldBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    if (process.env.NODE_ENV === "development")
      console.error("World rendering failed", error);
    this.props.onFailure?.();
  }
  render() {
    return this.state.failed ? (
      <div className="world-unavailable">
        <h2>Still my world.</h2>
        <p>Read the story or explore the index below.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function ExperienceShell() {
  const [biome, setBiome] = useState("planet"),
    [stop, setStop] = useState("arrival"),
    [lightMode, setLightMode] = useState("live"),
    [playing, setPlaying] = useState(false),
    [visible, setVisible] = useState(true),
    [reset, setReset] = useState(0),
    [roomReset, setRoomReset] = useState(0),
    [sheet, setSheet] = useState(null),
    [collection, setCollection] = useState("all"),
    [still, setStill] = useState(false),
    [graphicsError, setGraphicsError] = useState(false),
    [hint, setHint] = useState(""),
    [introBottom, setIntroBottom] = useState(0),
    [tierCeiling, setTierCeiling] = useState(null),
    [activeTier, setActiveTier] = useState(null),
    [sceneReady, setSceneReady] = useState(false);
  useEffect(() => {
    setTierCeiling(initialTier());
    const light = new URLSearchParams(location.search).get("light");
    if (light === "day" || light === "night") setLightMode(light);
  }, []);
  const markReady = useCallback(() => setSceneReady(true), []);
  const visitedScreens = useRef(new Set());
  const [walkerStatus, setWalkerStatus] = useState({
    distance: 0,
    cruise: false,
  });
  const reportWalker = useCallback((patch) => {
    setWalkerStatus((s) => ({ ...s, ...patch }));
    if (patch.world) setBiome(patch.world);
  }, []);
  const exitWalking = useCallback(() => {
    const entry = stop.slice(5);
    setStop(placeStops[biome]?.some((s) => s.id === entry) ? entry : "arrival");
    setReset((n) => n + 1);
  }, [biome, stop]);
  const [exhibitValues, setExhibitValues] = useState({});
  const [visitorColor, setVisitorColor] = useState(0);
  const [entertainmentChannel, setEntertainmentChannel] = useState(0);
  const [roomDetail, setRoomDetail] = useState(null);
  const [ballRequests, setBallRequests] = useState({});
  const [courtActivity, setCourtActivity] = useState({});
  const reportCourtActivity = useCallback((id, busy) => {
    setCourtActivity((current) =>
      current[id] === busy ? current : { ...current, [id]: busy },
    );
  }, []);
  const playCourt = useCallback((id) => {
    setCourtActivity((current) => ({ ...current, [id]: true }));
    setBallRequests((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  }, []);
  const residentClock = useRef({ elapsed: 0, waveAt: -Infinity });
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sri-wanderer-color");
      const color =
        stored === null
          ? crypto.getRandomValues(new Uint8Array(1))[0] % 4
          : Number(stored);
      if (Number.isInteger(color) && color >= 0 && color < 4) {
        setVisitorColor(color);
        localStorage.setItem("sri-wanderer-color", String(color));
      }
    } catch {
      /* The visitor can still choose a color without storage. */
    }
  }, []);
  const liveTime = useWorldTime();
  const weather = useWeather();
  const daylight =
    lightMode === "live"
      ? (liveTime?.daylight ?? 0)
      : lightMode === "day"
        ? 1
        : 0;
  const night = daylight < 0.4;
  const solar = {
    ...liveTime,
    daylight,
    direction:
      lightMode === "live"
        ? liveTime?.direction || [0, -1, 0]
        : lightMode === "day"
          ? [-0.6, 0.7, -0.38]
          : [0, -1, 0],
    warmth: lightMode === "live" ? liveTime?.warmth || 0 : 0,
    weather: weather || fallbackWeather,
  };
  const audio = useSoundscape(
      biome === "studio" &&
        (stop === "bay" || streetStop(biome, stop)?.group === "bay")
        ? "bay"
        : biome === "projects" && stop === "keynote"
          ? "keynote"
          : biome === "trail" && stop === "camp"
            ? "camp"
            : biome,
      sheet,
      roomDetail,
      weather,
    ),
    returnFocus = useRef(null),
    chapterGuide = useRef(null),
    introduction = useRef(null),
    exploration = useRef(null);
  useEffect(() => {
    // A stop selector or its Back control can unmount on navigation. Keep
    // keyboard focus in the local controls when the old target disappears.
    if (document.activeElement === document.body) {
      const target =
        exploration.current?.querySelector('[aria-pressed="true"]') ||
        exploration.current?.querySelector(
          "button:not(:disabled):not([aria-disabled=true])",
        );
      target?.focus({ preventScroll: true });
    }
  }, [biome, stop, still]);
  useEffect(() => {
    const strip = exploration.current?.querySelector(".place-stops");
    if (!strip) return;
    const revealSelection = () => {
      const selected = strip.querySelector('[aria-pressed="true"]');
      if (!selected || strip.scrollWidth <= strip.clientWidth) return;
      strip.scrollTo({
        left:
          strip.scrollLeft +
          selected.getBoundingClientRect().left -
          strip.getBoundingClientRect().left -
          (strip.clientWidth - selected.offsetWidth) / 2,
        behavior: playing ? "smooth" : "instant",
      });
    };
    const observer = new ResizeObserver(revealSelection);
    observer.observe(strip);
    revealSelection();
    return () => observer.disconnect();
  }, [biome, stop, still, playing]);
  useEffect(() => {
    if (biome !== "planet") return;
    const measure = () =>
      setIntroBottom(
        Math.ceil(introduction.current?.getBoundingClientRect().bottom || 0),
      );
    const observer = new ResizeObserver(measure);
    observer.observe(introduction.current);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [biome]);
  useEffect(() => {
    const guide = chapterGuide.current;
    const current = guide?.querySelector('[aria-current="location"]');
    if (!current || guide.scrollWidth <= guide.clientWidth) return;
    guide.scrollTo({
      left:
        guide.scrollLeft +
        current.getBoundingClientRect().left -
        guide.getBoundingClientRect().left -
        (guide.clientWidth - current.offsetWidth) / 2,
      behavior: playing ? "smooth" : "instant",
    });
  }, [biome, playing]);
  const graphicsUnavailable = useCallback(() => {
    setGraphicsError(true);
    setStill(true);
    setHint("");
  }, []);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setPlaying(!mq.matches && !navigator.connection?.saveData);
    update();
    mq.addEventListener("change", update);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const open = useCallback((id) => {
    if (id !== "work") clearProjectLink();
    setRoomDetail(null);
    setSheet(id);
  }, []);
  function show(id, group = "all") {
    returnFocus.current = document.activeElement;
    setCollection(group);
    audio.cue("open");
    open(id);
  }
  function changeChannel(index) {
    setEntertainmentChannel(index);
    audio.cue("object");
  }
  function close() {
    clearProjectLink();
    audio.cue("close");
    setSheet(null);
    requestAnimationFrame(() => {
      const previous = returnFocus.current;
      const target =
        previous?.isConnected && previous !== document.body
          ? previous
          : exploration.current?.querySelector('[aria-pressed="true"]') ||
            exploration.current?.querySelector("button");
      target?.focus({ preventScroll: true });
    });
  }
  const arrive = useCallback(
    (id) => {
      audio.cue("travel");
      setBiome(id);
      setStop("arrival");
      setHint("");
    },
    [audio.cue],
  );
  function travel(id) {
    clearProjectLink();
    setSheet(null);
    arrive(id);
    setReset((n) => n + 1);
  }
  function explore(id) {
    audio.cue("travel");
    setHint("");
    setStop(id);
    setReset((n) => n + 1);
  }
  // On a phone, a room left open for a few seconds releases the world: the
  // scene unmounts (freeing GPU memory) and returns when the room closes.
  const [worldResting, setWorldResting] = useState(false);
  useEffect(() => {
    if (!sheet) {
      setWorldResting(false);
      return;
    }
    const small = window.matchMedia(
      "(max-width: 700px), (pointer: coarse)",
    ).matches;
    if (!small) return;
    const timer = setTimeout(() => setWorldResting(true), 4000);
    return () => clearTimeout(timer);
  }, [sheet]);
  // Terminals (the "/" bar, the Discoveries console) act through one event.
  const commandAction = useRef(null);
  commandAction.current = (action) => {
    if (action.type === "travel") travel(action.biome);
    else if (action.type === "stop") {
      if (action.biome !== biome) travel(action.biome);
      else setSheet(null);
      explore(action.stop);
    } else if (action.type === "open") show(action.content);
  };
  useEffect(() => {
    const onCommand = (event) => commandAction.current?.(event.detail);
    window.addEventListener(COMMAND_EVENT, onCommand);
    return () => window.removeEventListener(COMMAND_EVENT, onCommand);
  }, []);
  function changeExhibit(id, value) {
    if (!projectExhibits[id] || exhibitStep(id, value)?.id !== value) return;
    audio.cue("object");
    setHint("");
    setExhibitValues((current) => ({ ...current, [id]: value }));
  }
  const openProject = useCallback(
    (id) => {
      returnFocus.current =
        document.activeElement === document.body
          ? exploration.current?.querySelector(`[data-project="${id}"]`) ||
            exploration.current?.querySelector('[aria-pressed="true"]') ||
            exploration.current?.querySelector("button")
          : document.activeElement;
      audio.cue("open");
      setCollection("all");
      window.location.hash = `project-${id}`;
      setSheet("work");
    },
    [audio.cue],
  );
  useEffect(() => {
    const follow = () => {
      const id = linkedProjectId(window.location.hash);
      if (allProjects.some((p) => projectId(p) === id)) {
        setCollection("all");
        open("work");
      }
    };
    const params = new URLSearchParams(window.location.search);
    const requestedRoom = params.get("room");
    if (readingSections.some((s) => s.id === requestedRoom)) {
      const destination = roomWorldDestination(
        requestedRoom,
        params.get("collection") || "all",
      );
      setBiome(destination.world);
      setStop(destination.stop);
      if (requestedRoom === "work")
        setCollection(params.get("collection") || "all");
      open(requestedRoom);
    }
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [open]);
  const chapter = allChapters.find((c) => c.id === biome),
    chapterId = biome === "entertainment" ? "court" : biome,
    next =
      chapters[
        (chapters.findIndex((c) => c.id === chapterId) + 1) % chapters.length
      ];
  const street = streetStop(biome, stop);
  const roaming = stop.startsWith("roam");
  const activeStop = placeStops[biome]?.find((s) => s.id === stop);
  const activeExhibit = biome === "projects" && !still && projectExhibits[stop];
  const atWorkbench = biome === "projects" && stop === "workbench" && !still;
  return (
    <div
      data-biome={biome}
      onClick={audio.press}
      className={`experience-shell ${night ? "shell-night" : ""} ${playing ? "" : "is-paused"}`}
    >
      <DiscoveryToast onOpen={() => show("discoveries")} />
      <PhysicsCursor enabled={playing && visible && !sheet} hint={hint} />
      <a className="skip-link" href="/story">
        Read the accessible story
      </a>
      <header className="experience-header">
        <button
          className="wordmark"
          aria-label="Sri — return to the whole world"
          onClick={() => travel("planet")}
        >
          <PersonalSignature />
          <span className="signature-caption">a work in progress.</span>
        </button>
        <div className="world-clock" aria-label="San Francisco time">
          <span>San Francisco</span>
          <time dateTime={liveTime?.iso}>
            {liveTime?.label || "Connecting to local time"}
          </time>
          <span className="world-weather" aria-live="polite">
            {weatherLabel(weather)}
          </span>
        </div>
        <nav className="header-links" aria-label="Main navigation">
          <button onClick={() => show("work")}>Work</button>
          <a href="/resume">Résumé</a>
          <button className="index-button" onClick={() => show("index")}>
            Index <span aria-hidden="true">≡</span>
          </button>
        </nav>
      </header>
      <main className="immersive-main" aria-label="Explore Sri’s world">
        <div className="immersive-canvas">
          {!still && tierCeiling && !worldResting ? (
            <WorldBoundary onFailure={graphicsUnavailable}>
              <WorldScene
                tier={tierCeiling}
                onTier={setActiveTier}
                onReady={markReady}
                introBottom={introBottom}
                world={biome}
                stop={stop}
                night={night}
                solar={solar}
                visitorColor={visitorColor}
                residentClock={residentClock.current}
                reset={reset}
                roomReset={roomReset}
                animate={playing && visible && !sheet}
                onScreenClick={(i) => {
                  if (i < 3) visitedScreens.current.add(i);
                  if (visitedScreens.current.size === 3)
                    discover("three-screens");
                  if (i === 3) {
                    show("discoveries");
                    return;
                  }
                  if (i === 4) {
                    show("writing");
                    return;
                  }
                  if (i === 2) {
                    setEntertainmentChannel(0);
                    show("music", "shows");
                  } else show(["work", "journey"][i]);
                }}
                onHover={setHint}
                onUnavailable={graphicsUnavailable}
                onBiomeSelect={arrive}
                onWalkerStatus={reportWalker}
                onWalkExit={exitWalking}
                onProjectOpen={openProject}
                onContentOpen={show}
                onStopSelect={explore}
                onCue={audio.cue}
                exhibitValues={exhibitValues}
                onExhibitChange={changeExhibit}
                channel={entertainmentChannel}
                ballRequests={ballRequests}
                onCourtActivity={reportCourtActivity}
                onCourtPlay={(id) => {
                  playCourt(id);
                  audio.cue("object");
                }}
                onChannelChange={changeChannel}
              />
            </WorldBoundary>
          ) : still ? (
            <div className="still-planet" aria-hidden="true">
              <i />
              <b />
              <span>✳</span>
            </div>
          ) : null}
        </div>
        {!still && !graphicsError && (
          <WorldLoader ready={sceneReady} tier={activeTier || tierCeiling} />
        )}
        {graphicsError && (
          <div className="graphics-notice" role="status">
            <p>
              The world is resting on this device. Everything is still in the
              index.
            </p>
            <button
              onClick={() => {
                setGraphicsError(false);
                setStill(false);
                setReset((n) => n + 1);
              }}
            >
              Try 3D again
            </button>
            <a href="/story">Read the story ↗</a>
          </div>
        )}
        <section
          ref={introduction}
          className={`narrative-heading ${biome === "planet" ? "intro-heading" : "place-heading"} ${activeStop || street || roaming ? "has-stop" : ""} ${activeStop?.compact ? "title-only" : ""} ${roaming ? "walking-heading-card" : ""}`}
          key={biome}
        >
          <p className="eyebrow">
            {chapter
              ? `${chapter.number} / ${chapter.label}`
              : "SRI UJJWAL REDDY · SAN FRANCISCO"}
          </p>
          <h1>
            {(roaming
              ? stop === "roam:roof"
                ? "Make yourself at home."
                : "A little wander."
              : null) ||
              street?.label ||
              activeStop?.label ||
              chapter?.title || (
                <>
                  I build things.
                  <br />
                  <span>And a life around them.</span>
                </>
              )}
          </h1>
          <p className="narrative-copy">
            {chapter?.description ||
              "Founding Engineer at Offseason, making an AI agent for personal wellness. Curious about the way things work. Particular about the way they feel."}
          </p>
          {chapter ? (
            <button
              className="text-action"
              onClick={() => show(chapter.content)}
            >
              {chapter.action} <span>↗</span>
            </button>
          ) : (
            <div className="intro-actions">
              <button
                className="primary-action"
                onClick={() => travel("studio")}
              >
                Start at home <span>↗</span>
              </button>
              <button className="text-action" onClick={() => show("work")}>
                See my work
              </button>
            </div>
          )}
        </section>
        {chapter && (
          <div
            ref={exploration}
            className={`place-exploration ${activeExhibit || atWorkbench ? "has-exhibit" : ""}`}
          >
            {roaming ? (
              <WalkingControls
                status={walkerStatus}
                roof={stop === "roam:roof"}
                paused={!playing}
                onExit={exitWalking}
                onOutside={() => explore("roam")}
                onRead={() =>
                  show(
                    placeStops[biome]?.find((s) => s.id === stop.slice(5))
                      ?.content || chapter.content,
                  )
                }
              />
            ) : street ? (
              <div className="street-controls">
                <p className="eyebrow">
                  ON FOOT ·{" "}
                  {streetIndex(stop) - streetRange(biome, stop).start + 1} /{" "}
                  {streetRange(biome, stop).end -
                    streetRange(biome, stop).start +
                    1}
                </p>
                <p>Look around. Follow a pavement arrow.</p>
                <div
                  className="street-look"
                  role="group"
                  aria-label="Look around"
                >
                  {[
                    [-1, 0, "Look left", "↶"],
                    [1, 0, "Look right", "↷"],
                    [0, -1, "Look up", "↑"],
                    [0, 1, "Look down", "↓"],
                  ].map(([x, y, label, icon]) => (
                    <button
                      key={label}
                      aria-label={label}
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("sri:look", { detail: { x, y } }),
                        )
                      }
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div>
                  <button
                    aria-disabled={
                      streetIndex(stop) === streetRange(biome, stop).start
                    }
                    onClick={() =>
                      streetIndex(stop) > streetRange(biome, stop).start &&
                      explore(`street:${streetIndex(stop) - 1}`)
                    }
                  >
                    ← Back
                  </button>
                  <button
                    aria-disabled={
                      streetIndex(stop) === streetRange(biome, stop).end
                    }
                    onClick={() =>
                      streetIndex(stop) < streetRange(biome, stop).end &&
                      explore(`street:${streetIndex(stop) + 1}`)
                    }
                  >
                    Walk on →
                  </button>
                  <button
                    onClick={() =>
                      explore(street.group === "bay" ? "bay" : "arrival")
                    }
                  >
                    See the place ↗
                  </button>
                </div>
                {street.group === "bay" &&
                  streetIndex(stop) === streetRange(biome, stop).end && (
                    <button onClick={() => travel("trail")}>
                      On to the outdoors →
                    </button>
                  )}
                {biome === "court" &&
                  streetIndex(stop) === streetRoutes.court.length - 1 && (
                    <button
                      onClick={() => {
                        arrive("entertainment");
                        setStop("street:0");
                      }}
                    >
                      To music & cinema →
                    </button>
                  )}
              </div>
            ) : activeExhibit ? (
              <ProjectExhibitControls
                id={stop}
                value={exhibitValues[stop]}
                onChange={changeExhibit}
                onBack={() => explore("arrival")}
              />
            ) : atWorkbench ? (
              <div className="exhibit-controls notebook-controls">
                <button
                  className="exhibit-back"
                  onClick={() => explore("arrival")}
                >
                  <span aria-hidden="true">←</span> The Foundry
                </button>
                <p className="exhibit-invitation">Pick up an idea.</p>
                <div
                  className="exhibit-steps"
                  role="group"
                  aria-label="Read a workbench notebook"
                >
                  {workbenchNotebooks.map((book, i) => (
                    <button
                      key={book.id}
                      data-project={book.id}
                      onClick={() => openProject(book.id)}
                    >
                      <span aria-hidden="true">0{i + 1}</span>
                      {book.name}
                    </button>
                  ))}
                </div>
                <p className="exhibit-result">
                  Small products, first attempts, and the things I learned by
                  making them.
                </p>
              </div>
            ) : (
              <>
                <div className="explore-mode">
                  <span className="eyebrow">LOOK A LITTLE CLOSER</span>
                  {!still && (
                    <button
                      className="walk-here"
                      onClick={() => explore(footEntry(biome, stop))}
                    >
                      Explore on foot ↗
                    </button>
                  )}
                </div>
                <div
                  className="place-stops"
                  role="group"
                  aria-label={`Explore ${chapter.label}`}
                >
                  <button
                    aria-pressed={stop === "arrival"}
                    onClick={() => explore("arrival")}
                  >
                    Take it in
                  </button>
                  {(biome === "court" || biome === "entertainment") && (
                    <button
                      onClick={() =>
                        travel(biome === "court" ? "entertainment" : "court")
                      }
                    >
                      {biome === "court" ? "Music & cinema ↗" : "The courts ↗"}
                    </button>
                  )}
                  {placeStops[biome]?.map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={stop === s.id}
                      onClick={() => explore(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {activeStop && (
              <div className="stop-actions">
                <button
                  className="stop-story"
                  onClick={() =>
                    activeStop.project
                      ? openProject(activeStop.project)
                      : show(
                          activeStop.content || chapter.content,
                          activeStop.collection || "all",
                        )
                  }
                >
                  {activeStop.prompt} <span>↗</span>
                </button>
                {biome === "studio" && stop === "walk" && !still && playing && (
                  <button
                    className="stop-story greeting-action"
                    onClick={() => {
                      residentClock.current.waveAt =
                        residentClock.current.elapsed;
                      audio.cue("object");
                    }}
                  >
                    Say hello
                  </button>
                )}
                {biome === "entertainment" && stop === "cinema" && !still && (
                  <button
                    className="stop-story greeting-action"
                    onClick={() =>
                      changeChannel((entertainmentChannel + 1) % shows.length)
                    }
                  >
                    Next show <span aria-hidden="true">→</span>
                  </button>
                )}
                {biome === "court" &&
                  ["basketball", "volleyball"].includes(stop) &&
                  !still &&
                  playing && (
                    <button
                      className="stop-story greeting-action"
                      aria-disabled={Boolean(courtActivity[stop])}
                      onClick={() => {
                        if (!courtActivity[stop]) playCourt(stop);
                      }}
                    >
                      {courtActivity[stop]
                        ? stop === "basketball"
                          ? "Shot in play"
                          : "Rally in play"
                        : stop === "basketball"
                          ? "Take a shot"
                          : "Serve the ball"}
                    </button>
                  )}
              </div>
            )}
          </div>
        )}
        <div className="world-caption" aria-live="polite">
          {(biome === "court" && !playing
            ? "Motion is paused. Turn it on in View & sound to play."
            : hint) ||
            (chapter
              ? street?.group === "bay"
                ? "City behind you. Trails ahead. Take your time crossing."
                : activeStop?.hint || chapter.note
              : "A small world. A few sides of me. Drag to look around.")}
        </div>
        <SettingsPopover>
          <div className="settings-options">
            <SoundPreferences audio={audio} />
            <details className="view-preferences">
              <summary>
                View &amp; motion <span aria-hidden="true">⌄</span>
              </summary>
              <div className="view-options">
                <div className="light-mode-control">
                  <span>
                    Light ·{" "}
                    {lightMode === "live"
                      ? liveTime?.phase || "Live"
                      : `${lightMode} preview`}
                  </span>
                  <div role="group" aria-label="World lighting">
                    {[
                      ["live", "Live SF"],
                      ["day", "Day"],
                      ["night", "Night"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={lightMode === id}
                        onClick={() => setLightMode(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <small>
                    {biome === "studio" &&
                    (stop === "bay" || street?.group === "bay")
                      ? "Open air above the water"
                      : biomeMoods[biome].label}
                  </small>
                </div>
                <button
                  className="wanderer-choice"
                  onClick={() => {
                    const color = (visitorColor + 1) % 4;
                    setVisitorColor(color);
                    try {
                      localStorage.setItem("sri-wanderer-color", String(color));
                    } catch {}
                  }}
                >
                  <span
                    style={{
                      background: ["#a5b7df", "#a4c7b8", "#c4aed4", "#d7b999"][
                        visitorColor
                      ],
                    }}
                  />{" "}
                  Your wanderer <small>Change color</small>
                </button>
                <button
                  aria-pressed={playing}
                  onClick={() => setPlaying(!playing)}
                >
                  Motion
                </button>
                <button
                  aria-pressed={!still}
                  onClick={() => {
                    setGraphicsError(false);
                    setStill(!still);
                  }}
                >
                  3D world
                </button>
                <button
                  onClick={() => {
                    setReset((n) => n + 1);
                    if (biome === "studio") setRoomReset((n) => n + 1);
                  }}
                >
                  Reset this view ↺
                </button>
              </div>
            </details>
          </div>
        </SettingsPopover>
      </main>
      <footer className="journey-footer">
        <button
          className={`map-button ${biome === "planet" ? "is-current" : ""}`}
          aria-current={biome === "planet" ? "location" : undefined}
          onClick={() => travel("planet")}
          aria-label="See the whole world"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <ellipse cx="12" cy="12" rx="3.5" ry="8" />
            <path d="M4 12h16" />
          </svg>
          <span>World</span>
        </button>
        <CommandBar biome={biome} />
        <nav
          ref={chapterGuide}
          className="chapter-route"
          aria-label="Chapters of my world"
        >
          {chapters.map((c) => (
            <button
              key={c.id}
              aria-current={chapterId === c.id ? "location" : undefined}
              onClick={() => travel(c.id)}
            >
              <small>{c.upcoming ? "◌" : c.number}</small>
              <span>{c.short}</span>
            </button>
          ))}
        </nav>
        <button
          className="next-place"
          onClick={() => travel(next.id)}
          aria-label={`Continue to ${next.label}`}
        >
          <span>{chapter ? "Keep exploring" : "Come on in"}</span>
          <b aria-hidden="true">→</b>
        </button>
      </footer>
      <button
        className={`sound-toggle ${audio.enabled ? "sound-on" : ""}`}
        aria-label={
          audio.enabled ? "Mute environment sound" : "Enable environment sound"
        }
        aria-pressed={audio.enabled}
        onClick={audio.toggle}
        data-quiet
      >
        <span className="sound-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>
          {audio.status === "starting"
            ? "Preparing sound…"
            : audio.error
              ? "Retry sound"
              : audio.enabled
                ? "Sound on"
                : "Listen to this world"}
        </span>
      </button>
      {sheet && (
        <ReadingSheet
          audio={audio}
          onSoundRoomChange={setRoomDetail}
          id={sheet}
          collection={collection}
          onClose={close}
          onOpen={(id) => {
            setCollection("all");
            open(id);
          }}
          onTravel={travel}
          channel={entertainmentChannel}
          onChannelChange={changeChannel}
        />
      )}
    </div>
  );
}
