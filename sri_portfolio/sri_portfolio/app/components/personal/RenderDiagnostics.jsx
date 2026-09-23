"use client";
import { useEffect, useRef, useState } from "react";
import { addAfterEffect, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

// Opt-in development measurements. Do not request extra frames or change the
// scene's animation cadence; the counter includes shadow and main passes.
export default function RenderDiagnostics() {
  const output = useRef(),
    frameStart = useRef(0),
    capture = useRef(null),
    captureTimer = useRef(),
    observer = useRef();
  const [report, setReport] = useState(""),
    [recording, setRecording] = useState(false);
  const { gl } = useThree();
  useFrame(() => {
    gl.info.reset();
    frameStart.current = performance.now();
  }, -100);
  function collect(entries) {
    const c = capture.current;
    if (!c) return;
    entries.forEach((entry) => {
      if (entry.startTime < c.start) return;
      c.tasks++;
      c.longestTask = Math.max(c.longestTask, entry.duration);
      c.blocking += Math.max(0, entry.duration - 50);
    });
  }
  function recordTrip() {
    clearTimeout(captureTimer.current);
    observer.current?.disconnect();
    const supported =
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes.includes("longtask");
    capture.current = {
      start: performance.now(),
      frames: 0,
      cpuPeak: 0,
      gapPeak: 0,
      previous: 0,
      tasks: 0,
      longestTask: 0,
      blocking: 0,
      calls: 0,
    };
    if (supported) {
      observer.current = new PerformanceObserver((list) =>
        collect(list.getEntries()),
      );
      observer.current.observe({ entryTypes: ["longtask"] });
    }
    setRecording(true);
    setReport("Recording this page for 8 seconds. Choose a place now.");
    captureTimer.current = setTimeout(() => {
      if (observer.current) collect(observer.current.takeRecords());
      observer.current?.disconnect();
      const c = capture.current;
      capture.current = null;
      setRecording(false);
      if (!c) return;
      setReport(
        `${c.frames} frames · peak CPU ${c.cpuPeak.toFixed(0)} ms · longest frame gap ${c.gapPeak.toFixed(0)} ms · peak calls ${c.calls} · ${supported ? `${c.tasks} long tasks · longest ${c.longestTask.toFixed(0)} ms · blocking ${c.blocking.toFixed(0)} ms` : "long-task timing unavailable"}`,
      );
    }, 8000);
  }
  useEffect(
    () => () => {
      clearTimeout(captureTimer.current);
      observer.current?.disconnect();
      capture.current = null;
    },
    [],
  );
  useEffect(() => {
    const previous = gl.info.autoReset;
    gl.info.autoReset = false;
    let start = performance.now(),
      count = 0,
      total = 0;
    const stop = addAfterEffect(() => {
      if (!frameStart.current) return;
      const now = performance.now(),
        cpu = now - frameStart.current,
        c = capture.current;
      if (c) {
        c.frames++;
        c.cpuPeak = Math.max(c.cpuPeak, cpu);
        if (c.previous)
          c.gapPeak = Math.max(c.gapPeak, frameStart.current - c.previous);
        c.previous = frameStart.current;
        c.calls = Math.max(c.calls, gl.info.render.calls);
      }
      count++;
      total += cpu;
      frameStart.current = 0;
      const elapsed = performance.now() - start;
      if (elapsed < 2500 || !output.current) return;
      output.current.textContent = `${gl.info.render.calls} draw calls · ${Math.round(gl.info.render.triangles / 1000)}k triangles · ${gl.info.memory.geometries} geometries · ${gl.info.memory.textures} textures · ${gl.info.programs.length} programs · ${(total / count).toFixed(1)} ms CPU/frame · ${((count * 1000) / elapsed).toFixed(1)} fps · DPR ${gl.getPixelRatio()}`;
      start = performance.now();
      count = 0;
      total = 0;
    });
    return () => {
      stop();
      gl.info.autoReset = previous;
    };
  }, [gl]);
  return (
    <Html
      fullscreen
      calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}
      style={{ pointerEvents: "none" }}
    >
      <div className="render-diagnostics">
        <output aria-label="Development render sample" ref={output}>
          Measuring the active scene…
        </output>
        <button
          className="trip-test-control"
          onClick={recordTrip}
          disabled={recording}
        >
          {recording ? "Recording trip…" : "Measure next trip"}
        </button>
        {report && <output aria-label="Trip render sample">{report}</output>}
      </div>
    </Html>
  );
}
