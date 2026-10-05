"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import UiIcon from "./UiIcon";
import MorphHeading from "./MorphHeading";
import { skinIdentity } from "../../lib/biome-morph.mjs";
import { biomeSkinStyle } from "../../lib/biome-skins.mjs";
import WalkingControls from "./WalkingControls";
import DiscoveryToast from "./DiscoveryToast";
import { discover } from "../../lib/discoveries.mjs";
import CommandBar from "./CommandBar";
import BiomePages from "./BiomePages";
import KeynoteControls from "./KeynoteControls";
import { COMMAND_EVENT } from "./command-events";
import { emptyHover, nextHover } from "../../lib/scene-hover.mjs";
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
import {
  worldReturnState,
  withWorldReturn,
  hasEnteredWorld,
  rememberWorldEntry,
} from "../../lib/world-return.mjs";
import {
  PHONE_LAYOUT_QUERY,
  navigationStop,
} from "../../lib/mobile-navigation.mjs";
import { initialTier } from "../../lib/device-tier.mjs";
import { worldLoading } from "../../lib/world-loading.mjs";
import {
  createAssetPreloader,
  startupAssetsForTier,
} from "../../lib/world-assets.mjs";
function footEntry(biome, stop) {
  if (
    biome === "future" &&
    ["writing", "socials", "collaborate"].includes(stop)
  )
    return `roam:${stop}`;
  if (biome === "trail" && stop === "overlook") return "roam:overlook";
  return biome === "studio" && stop !== "bay" ? "roam:roof" : "roam";
}
let terrainPreparation;
const assetPreloaders = new Map();
function preloadAssets(tier) {
  if (!assetPreloaders.has(tier))
    assetPreloaders.set(
      tier,
      createAssetPreloader({
        assets: startupAssetsForTier(tier),
        onProgress: worldLoading.report,
      }),
    );
  return assetPreloaders.get(tier)();
}
function prepareWorldTerrain() {
  return (terrainPreparation ||= (async () => {
    const { prepareTerrainInBackground } =
      await import("../../lib/terrain-preparation.mjs");
    const terrainMethod = await prepareTerrainInBackground();
    worldLoading.report({ terrain: true, terrainMethod });
  })());
}
const WorldScene = dynamic(
  async () => {
    await prepareWorldTerrain();
    const scene = await import("./WorldScene");
    worldLoading.report({ code: true });
    return scene;
  },
  { ssr: false, loading: () => null },
);
function clearProjectLink() {
  if (linkedProjectId(window.location.hash))
    window.history.replaceState(
      window.history.state,
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
    [previewsExpanded, setPreviewsExpanded] = useState(true),
    [phone, setPhone] = useState(false),
    [toolsExpanded, setToolsExpanded] = useState(false),
    [collection, setCollection] = useState("all"),
    [still, setStill] = useState(false),
    [graphicsError, setGraphicsError] = useState(false),
    [hover, setHover] = useState(emptyHover),
    [introBottom, setIntroBottom] = useState(0),
    [tierCeiling, setTierCeiling] = useState(null),
    [sceneReady, setSceneReady] = useState(false),
    [prepareWorld, setPrepareWorld] = useState(false),
    [entered, setEntered] = useState(null),
    [returning, setReturning] = useState(false);
  useEffect(() => {
    setTierCeiling(initialTier());
    const light = new URLSearchParams(location.search).get("light");
    if (light === "day" || light === "night") setLightMode(light);
  }, []);
  const mobileTools = useRef(null);
  const restoredTools = useRef(null);
  const mobileToolsToggle = useRef(null);
  useEffect(() => {
    const mq = matchMedia(PHONE_LAYOUT_QUERY);
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const collapseTools = useCallback(() => {
    // Selecting a view must never leave focus inside the now-inert drawer.
    if (mobileTools.current?.contains(document.activeElement))
      mobileToolsToggle.current?.focus({ preventScroll: true });
    setToolsExpanded(false);
  }, []);
  useEffect(() => {
    if (restoredTools.current !== null) {
      setToolsExpanded(restoredTools.current);
      restoredTools.current = null;
      return;
    }
    collapseTools();
    if (
      stop.startsWith("roam") ||
      stop.startsWith("street:") ||
      (biome === "projects" && (projectExhibits[stop] || stop === "keynote"))
    )
      setToolsExpanded(true);
  }, [biome, stop, collapseTools]);
  useEffect(() => {
    // Resizing or returning from a full page must not revive phone walking.
    const nextStop = navigationStop(biome, stop, phone);
    if (nextStop !== stop) {
      setStop(nextStop);
      setReset((value) => value + 1);
    }
  }, [biome, stop, phone]);
  const hint = hover.text;
  const setHint = useCallback((text, event, cursor) => {
    setHover((current) => nextHover(current, text, event, cursor));
  }, []);
  const markReady = useCallback(() => setSceneReady(true), []);
  const prepareScene = useCallback(() => setPrepareWorld(true), []);
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
  const [keynoteIndex, setKeynoteIndex] = useState(0);
  const [visitorColor, setVisitorColor] = useState(0);
  const [entertainmentChannel, setEntertainmentChannel] = useState(0);
  const [roomDetail, setRoomDetail] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
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
      { autoStart: true },
    ),
    returnFocus = useRef(null),
    chapterGuide = useRef(null),
    introduction = useRef(null),
    exploration = useRef(null);
  useEffect(() => {
    if (!playing || audio.reducedMotion) audio.cue("cancel-morph");
  }, [playing, audio.reducedMotion, audio.cue]);
  useLayoutEffect(() => {
    const guide = chapterGuide.current;
    const measure = () => {
      const selected = guide?.querySelector('[aria-current="location"]');
      if (!selected) return;
      guide.style.setProperty("--route-x", `${selected.offsetLeft}px`);
      guide.style.setProperty("--route-y", `${selected.offsetTop}px`);
      guide.style.setProperty("--route-width", `${selected.offsetWidth}px`);
      guide.style.setProperty("--route-height", `${selected.offsetHeight}px`);
      if (guide.scrollWidth > guide.clientWidth) {
        guide.scrollTo({
          left:
            selected.offsetLeft -
            (guide.clientWidth - selected.offsetWidth) / 2,
          behavior: "instant",
        });
      }
    };
    const observer = new ResizeObserver(measure);
    if (guide) {
      observer.observe(guide);
      guide
        .querySelectorAll("button")
        .forEach((button) => observer.observe(button));
    }
    measure();
    return () => observer.disconnect();
  }, [biome]);
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
  const preloadScene = useCallback(() => {
    preloadAssets(tierCeiling || initialTier());
    prepareWorldTerrain().catch(graphicsUnavailable);
  }, [graphicsUnavailable, tierCeiling]);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setPlaying(!mq.matches && !navigator.connection?.saveData);
    // A return restores the visitor's explicit pause choice below.
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
    setEntered(true);
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
      const morph =
        biome !== "planet" &&
        id !== "planet" &&
        skinIdentity(biome) !== skinIdentity(id) &&
        playing &&
        !audio.reducedMotion;
      audio.cue(morph ? "morph" : "travel", { destination: id });
      setBiome(id);
      setStop("arrival");
      setHint("");
    },
    [audio.cue, audio.reducedMotion, biome, playing],
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
    setStop(navigationStop(biome, id, phone));
    setReset((n) => n + 1);
  }
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
    const url =
      window.location.pathname + window.location.search + window.location.hash;
    const saved = worldReturnState(window.history.state, url);
    let previouslyEntered = false;
    try {
      previouslyEntered = hasEnteredWorld(window.sessionStorage);
    } catch {}
    if (!saved) setPreviewsExpanded(!matchMedia("(max-width: 700px)").matches);
    setEntered(Boolean(saved || previouslyEntered));
    setReturning(Boolean(saved || previouslyEntered));
    if (
      saved &&
      (saved.biome === "planet" ||
        allChapters.some((c) => c.id === saved.biome))
    ) {
      restoredTools.current = saved.toolsExpanded === true;
      setToolsExpanded(restoredTools.current);
      setBiome(saved.biome);
      setStop(
        navigationStop(
          saved.biome,
          saved.stop,
          matchMedia(PHONE_LAYOUT_QUERY).matches,
        ),
      );
      setSheet(
        saved.sheet === "index" ||
          readingSections.some((r) => r.id === saved.sheet)
          ? saved.sheet
          : null,
      );
      setCollection(saved.collection || "all");
      setPreviewsExpanded(saved.previewsExpanded !== false);
      setPlaying(saved.playing === true);
      setStill(saved.still === true);
      if (["live", "day", "night"].includes(saved.lightMode))
        setLightMode(saved.lightMode);
      // Do not replay an old ?room= link over the restored camera or sheet.
      window.addEventListener("hashchange", follow);
      return () => window.removeEventListener("hashchange", follow);
    }
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
  const returnSnapshot = useRef(null);
  returnSnapshot.current = {
    entered,
    biome,
    stop,
    sheet,
    collection,
    previewsExpanded,
    toolsExpanded,
    playing,
    still,
    lightMode,
  };
  useEffect(() => {
    if (entered) {
      try {
        rememberWorldEntry(window.sessionStorage);
      } catch {}
    }
  }, [entered]);
  useEffect(() => {
    const save = () => {
      const snapshot = returnSnapshot.current;
      if (!snapshot?.entered) return;
      try {
        const url =
          window.location.pathname +
          window.location.search +
          window.location.hash;
        window.history.replaceState(
          withWorldReturn(window.history.state, snapshot, url),
          "",
          url,
        );
      } catch {
        /* Navigation must work even when the browser denies storage. */
      }
    };
    const leaving = (event) => {
      const link = event.target.closest?.("a[href]");
      if (
        !link ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank"
      )
        return;
      if (
        link.origin === window.location.origin &&
        link.pathname !== window.location.pathname
      )
        save();
    };
    document.addEventListener("click", leaving, true);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("click", leaving, true);
      window.removeEventListener("pagehide", save);
    };
  }, []);
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
      data-entry-pending={entered === null}
      style={biomeSkinStyle(biome)}
      onClick={audio.press}
      className={`experience-shell ${night ? "shell-night" : ""} ${playing ? "" : "is-paused"}`}
    >
      <DiscoveryToast onOpen={() => show("discoveries")} />
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
            Index <UiIcon name="menu" />
          </button>
        </nav>
      </header>
      <main className="immersive-main" aria-label="Explore Sri’s world">
        <div className="immersive-canvas">
          {!still && tierCeiling && (entered || prepareWorld) ? (
            <WorldBoundary onFailure={graphicsUnavailable}>
              <WorldScene
                tier={tierCeiling}
                onReady={markReady}
                introBottom={introBottom}
                world={biome}
                stop={stop}
                keynoteIndex={keynoteIndex}
                night={night}
                solar={solar}
                visitorColor={visitorColor}
                residentClock={residentClock.current}
                reset={reset}
                roomReset={roomReset}
                animate={entered && playing && visible && !sheet && !searchOpen}
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
                pointerEnabled={entered && visible && !sheet && !searchOpen}
                hoverCursor={hover.cursor}
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
        {entered === false && (
          <WorldLoader
            onPreload={preloadScene}
            onPrepare={prepareScene}
            ready={sceneReady || still || graphicsError}
            soundEnabled={audio.enabled}
            soundPreferred={audio.preferences.enabled}
            soundStatus={audio.status}
            onIntroSound={async () => {
              if (audio.enabled) {
                audio.disable();
                return false;
              }
              return audio.enable(null);
            }}
            onIntroPlayback={audio.introduction}
            onChooseAudio={(withAudio) =>
              withAudio ? audio.enable() : audio.disable()
            }
            onEnter={() => {
              setEntered(true);
              requestAnimationFrame(() =>
                introduction.current
                  ?.querySelector("button")
                  ?.focus({ preventScroll: true }),
              );
            }}
          />
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
            <a href="/story">
              Read the story <UiIcon />
            </a>
          </div>
        )}
        <div
          className={
            chapter
              ? `place-story ${activeStop || street || roaming ? "is-close" : ""}`
              : "world-story"
          }
        >
          <section
            ref={introduction}
            className={`narrative-heading ${biome === "planet" ? "intro-heading" : "place-heading"} ${activeStop || street || roaming ? "has-stop" : ""} ${activeStop?.compact ? "title-only" : ""} ${roaming ? "walking-heading-card" : ""}`}
          >
            {chapter ? (
              <MorphHeading
                biome={biome}
                stop={stop}
                motion={playing}
                eyebrow={`${chapter.number} / ${chapter.label}`}
                title={
                  (roaming
                    ? stop === "roam:roof"
                      ? "Make yourself at home."
                      : "A little wander."
                    : null) ||
                  street?.label ||
                  activeStop?.label ||
                  chapter.title
                }
                description={chapter.description}
                compact={Boolean(activeStop || street || roaming)}
              />
            ) : (
              <>
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
                  {phone
                    ? "Founding Engineer at Offseason. I build AI agents and the systems that make them useful."
                    : "Founding Engineer at Offseason. I build AI agents, the context they work with, and the harnesses that turn model capability into useful products."}
                </p>
              </>
            )}
            {!chapter && (
              <div className="intro-actions">
                <button
                  className="primary-action"
                  onClick={() => travel("studio")}
                >
                  Start at home <UiIcon />
                </button>
                <button className="text-action" onClick={() => show("work")}>
                  See my work
                </button>
              </div>
            )}
          </section>
        </div>
        {chapter && (
          <div
            className="place-tools"
            data-expanded={toolsExpanded}
            onKeyDown={(event) => {
              if (event.key === "Escape" && toolsExpanded) {
                event.preventDefault();
                event.stopPropagation();
                collapseTools();
              }
            }}
          >
            <button
              className="mobile-tools-toggle"
              ref={mobileToolsToggle}
              aria-expanded={toolsExpanded}
              aria-controls="place-tools-content"
              onClick={() => setToolsExpanded((value) => !value)}
            >
              <span>
                <strong>
                  {toolsExpanded
                    ? "Back to the view"
                    : `Explore ${chapter.short}`}
                </strong>
                <small>
                  {toolsExpanded ? chapter.label : "Views & stories"}
                </small>
              </span>
              <UiIcon name={toolsExpanded ? "chevronDown" : "chevronUp"} />
            </button>
            <div
              className="place-tools-reveal"
              id="place-tools-content"
              inert={phone && !toolsExpanded}
              ref={mobileTools}
            >
              <div className="place-tools-content">
                <p className="mobile-place-description">
                  {chapter.description}
                </p>
                {biome === "projects" && stop === "keynote" && (
                  <KeynoteControls
                    index={keynoteIndex}
                    onChange={setKeynoteIndex}
                    onOpen={openProject}
                  />
                )}
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
                            placeStops[biome]?.find(
                              (s) => s.id === stop.slice(5),
                            )?.content || chapter.content,
                          )
                        }
                      />
                    ) : street ? (
                      <div className="street-controls">
                        <p className="eyebrow">
                          ON FOOT ·{" "}
                          {streetIndex(stop) -
                            streetRange(biome, stop).start +
                            1}{" "}
                          /{" "}
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
                                  new CustomEvent("sri:look", {
                                    detail: { x, y },
                                  }),
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
                              streetIndex(stop) ===
                              streetRange(biome, stop).start
                            }
                            onClick={() =>
                              streetIndex(stop) >
                                streetRange(biome, stop).start &&
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
                              streetIndex(stop) <
                                streetRange(biome, stop).end &&
                              explore(`street:${streetIndex(stop) + 1}`)
                            }
                          >
                            Walk on →
                          </button>
                          <button
                            onClick={() =>
                              explore(
                                street.group === "bay" ? "bay" : "arrival",
                              )
                            }
                          >
                            See the place <UiIcon />
                          </button>
                        </div>
                        {street.group === "bay" &&
                          streetIndex(stop) ===
                            streetRange(biome, stop).end && (
                            <button onClick={() => travel("trail")}>
                              On to the outdoors →
                            </button>
                          )}
                        {biome === "court" &&
                          streetIndex(stop) ===
                            streetRoutes.court.length - 1 && (
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
                          <UiIcon name="arrowLeft" /> The Foundry
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
                          Small products, first attempts, and the things I
                          learned by making them.
                        </p>
                      </div>
                    ) : (
                      <>
                        {!phone && (
                          <div className="explore-mode">
                            <span className="eyebrow">
                              LOOK A LITTLE CLOSER
                            </span>
                            {!still && (
                              <button
                                className="walk-here"
                                onClick={() => explore(footEntry(biome, stop))}
                              >
                                Explore on foot <UiIcon />
                              </button>
                            )}
                          </div>
                        )}
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
                                travel(
                                  biome === "court" ? "entertainment" : "court",
                                )
                              }
                            >
                              {biome === "court"
                                ? "Music & cinema"
                                : "The courts"}{" "}
                              <UiIcon />
                            </button>
                          )}
                          {!(biome === "projects" && stop === "keynote") &&
                            placeStops[biome]?.map((s) => (
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
                    {activeStop && stop !== "keynote" && (
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
                          {activeStop.prompt} <UiIcon />
                        </button>
                        {biome === "studio" &&
                          stop === "walk" &&
                          !still &&
                          playing && (
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
                        {biome === "entertainment" &&
                          stop === "cinema" &&
                          !still && (
                            <button
                              className="stop-story greeting-action"
                              onClick={() =>
                                changeChannel(
                                  (entertainmentChannel + 1) % shows.length,
                                )
                              }
                            >
                              Next show <UiIcon name="arrowRight" />
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
                {!(biome === "projects" && stop === "keynote") && (
                  <BiomePages
                    biome={biome}
                    onOpen={show}
                    expanded={phone || previewsExpanded}
                    onExpandedChange={setPreviewsExpanded}
                  />
                )}
              </div>
            </div>
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
                View &amp; motion <UiIcon name="chevronDown" />
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
                  Reset this view <UiIcon name="replay" />
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
          <UiIcon name="globe" size={24} />
          <span>World</span>
        </button>
        <CommandBar biome={biome} onOpenChange={setSearchOpen} />
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
              <span className="skin-nav-label" key={`${biome}-${c.id}`}>
                {c.short}
              </span>
            </button>
          ))}
        </nav>
        <button
          className="next-place"
          onClick={() => travel(next.id)}
          aria-label={`Continue to ${next.label}`}
        >
          <span>{chapter ? "Keep exploring" : "Come on in"}</span>
          <UiIcon name="arrowRight" size={24} />
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
