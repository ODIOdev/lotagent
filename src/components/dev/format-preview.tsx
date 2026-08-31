"use client";

import {
  FORMAT_EVENT,
  FORMAT_ORIENT_EVENT,
  FORMAT_ORIENT_KEY,
  FORMAT_SIZE,
  FORMAT_STORAGE_KEY,
  formatFrameSize,
  formatPreviewAllowed,
  formatSpec,
  parseFormatMode,
  parseFormatOrient,
  setFormatMode,
  setFormatOrient,
  type FormatMode,
  type FormatOrient,
} from "@/lib/format-preview";
import { Monitor, RotateCw, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

function StatusTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <>
      {now
        .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        .replace(/\s?(AM|PM)$/i, "")}
    </>
  );
}

function SignalIcons() {
  return (
    <span className="la-statusIcons" aria-hidden>
      <svg className="la-statusSignal" viewBox="0 0 18 13" fill="currentColor">
        <rect x="0" y="8.2" width="3" height="4.8" rx="0.6" />
        <rect x="4.6" y="5.8" width="3" height="7.2" rx="0.6" />
        <rect x="9.2" y="3.2" width="3" height="9.8" rx="0.6" />
        <rect x="13.8" y="0.8" width="3" height="12.2" rx="0.6" opacity="0.35" />
      </svg>
      <svg className="la-statusWifi" viewBox="0 0 17 13" fill="none">
        <path d="M8.5 10.1a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" fill="currentColor" />
        <path d="M4.6 7.8a5.6 5.6 0 0 1 7.8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2.2 5.3a8.8 8.8 0 0 1 12.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M0.7 2.9a11.6 11.6 0 0 1 15.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".55" />
      </svg>
      <svg className="la-statusBattery" viewBox="0 0 27 13" fill="none">
        <rect x="0.7" y="1.3" width="22.2" height="10.4" rx="2.4" stroke="currentColor" strokeWidth="1.4" opacity=".5" />
        <rect x="2.4" y="3" width="17.2" height="7" rx="1.3" fill="currentColor" />
        <path d="M24.2 4.1c.9.35 1.4 1 1.4 2.4s-.5 2.05-1.4 2.4V4.1Z" fill="currentColor" opacity=".5" />
      </svg>
    </span>
  );
}

function useFormatMode() {
  const [mode, setMode] = useState<FormatMode>("desktop");
  const [orient, setOrient] = useState<FormatOrient>("portrait");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = parseFormatMode(params.get("format"));
    const fromStore = parseFormatMode(window.sessionStorage.getItem(FORMAT_STORAGE_KEY));
    setMode(fromQuery ?? fromStore ?? "desktop");
    const orientQuery = parseFormatOrient(params.get("orient"));
    const orientStore = parseFormatOrient(window.sessionStorage.getItem(FORMAT_ORIENT_KEY));
    setOrient(orientQuery ?? orientStore ?? "portrait");
  }, []);

  useEffect(() => {
    function onSet(event: Event) {
      const next = (event as CustomEvent<FormatMode>).detail;
      if (next) setMode(next);
    }
    function onOrient(event: Event) {
      const next = (event as CustomEvent<FormatOrient>).detail;
      if (next) setOrient(next);
    }
    window.addEventListener(FORMAT_EVENT, onSet);
    window.addEventListener(FORMAT_ORIENT_EVENT, onOrient);
    return () => {
      window.removeEventListener(FORMAT_EVENT, onSet);
      window.removeEventListener(FORMAT_ORIENT_EVENT, onOrient);
    };
  }, []);

  const select = useCallback((next: FormatMode) => {
    setMode(next);
    setFormatMode(next);
    if (next === "desktop") {
      setOrient("portrait");
      setFormatOrient("portrait");
    }
  }, []);

  const rotate = useCallback(() => {
    const next = orient === "portrait" ? "landscape" : "portrait";
    setOrient(next);
    setFormatOrient(next);
  }, [orient]);

  return { mode, orient, select, rotate };
}

function useFitScale(width: number, height: number, bezel = 24) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function measure() {
      const availW = window.innerWidth - 32;
      const availH = window.innerHeight - 56 - 32;
      setScale(Math.min(1, availW / (width + bezel), availH / (height + bezel)));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [width, height, bezel]);
  return scale;
}

function FormatBar({
  mode,
  orient,
  onChange,
  onRotate,
}: {
  mode: FormatMode;
  orient: FormatOrient;
  onChange: (next: FormatMode) => void;
  onRotate: () => void;
}) {
  const meta = FORMAT_SIZE[mode];
  return (
    <div className="la-studioBar">
      <div>
        <b>Format</b>
        <small>
          {meta.label} · {formatSpec(mode, orient)}
        </small>
      </div>
      <div className="la-studioBarTools">
        {mode !== "desktop" ? (
          <button
            type="button"
            className={`la-rotateBtn${orient === "landscape" ? " on" : ""}`}
            onClick={onRotate}
            title={orient === "landscape" ? "Portrait" : "Landscape"}
          >
            <RotateCw className="size-3.5" />
            Rotate
          </button>
        ) : null}
        <div className="la-formatToggle" role="tablist" aria-label="Device format">
          <button type="button" className={mode === "iphone" ? "on" : ""} onClick={() => onChange("iphone")}>
            <Smartphone className="size-3.5" />
            iPhone
          </button>
          <button type="button" className={mode === "ipad" ? "on" : ""} onClick={() => onChange("ipad")}>
            <Tablet className="size-3.5" />
            iPad
          </button>
          <button type="button" className={mode === "desktop" ? "on" : ""} onClick={() => onChange("desktop")}>
            <Monitor className="size-3.5" />
            Desktop
          </button>
        </div>
      </div>
    </div>
  );
}

function IphoneShell({ children, orient }: { children: ReactNode; orient: FormatOrient }) {
  const { width, height } = formatFrameSize("iphone", orient);
  const bezel = 24;
  const scale = useFitScale(width, height, bezel);
  return (
    <div
      className="la-deviceScale"
      style={{
        width: (width + bezel) * scale,
        height: (height + bezel) * scale,
      }}
    >
      <div
        className={`la-iphone${orient === "landscape" ? " landscape" : ""}`}
        aria-label={`iPhone 14 / 15 ${orient} frame`}
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <div className="la-deviceGlass" style={{ width, height }}>
          <div className="la-iphoneIsland" />
          <div className="la-iphoneStatus">
            <span>
              <StatusTime />
            </span>
            <SignalIcons />
          </div>
          <div className="la-formatScroll">{children}</div>
          <div className="la-iphoneHome" />
        </div>
      </div>
    </div>
  );
}

function IpadShell({ children, orient }: { children: ReactNode; orient: FormatOrient }) {
  const { width, height } = formatFrameSize("ipad", orient);
  const bezel = 36;
  const scale = useFitScale(width, height, bezel);
  return (
    <div
      className="la-deviceScale"
      style={{
        width: (width + bezel) * scale,
        height: (height + bezel) * scale,
      }}
    >
      <div
        className={`la-ipad${orient === "landscape" ? " landscape" : ""}`}
        aria-label={`iPad Air 11 inch ${orient} frame`}
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <div className="la-deviceGlass" style={{ width, height }}>
          <div className="la-ipadCam" />
          <div className="la-ipadStatus">
            <span>
              <StatusTime />
            </span>
            <SignalIcons />
          </div>
          <div className="la-formatScroll">{children}</div>
          <div className="la-ipadHome" />
        </div>
      </div>
    </div>
  );
}

function FormatPreviewInner({ children }: { children: ReactNode }) {
  const { mode, orient, select, rotate } = useFormatMode();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.laFormat = mode;
    root.dataset.laOrient = mode === "desktop" ? "portrait" : orient;
    root.classList.toggle("phone-sim", mode === "iphone");
    root.classList.toggle("tablet-sim", mode === "ipad");
    return () => {
      delete root.dataset.laFormat;
      delete root.dataset.laOrient;
      root.classList.remove("phone-sim", "tablet-sim");
    };
  }, [mode, orient]);

  const framed = <div className="la-root">{children}</div>;

  return (
    <div className="la-studio">
      <FormatBar mode={mode} orient={orient} onChange={select} onRotate={rotate} />
      {mode === "iphone" ? (
        <div className="la-studioStage">
          <IphoneShell orient={orient}>{framed}</IphoneShell>
        </div>
      ) : mode === "ipad" ? (
        <div className="la-studioStage">
          <IpadShell orient={orient}>{framed}</IpadShell>
        </div>
      ) : (
        framed
      )}
    </div>
  );
}

export function FormatPreview({ children }: { children: ReactNode }) {
  if (!formatPreviewAllowed()) {
    return <div className="la-root">{children}</div>;
  }

  return <FormatPreviewInner>{children}</FormatPreviewInner>;
}
