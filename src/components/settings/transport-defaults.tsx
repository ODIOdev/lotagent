"use client";

import {
  loadTransportDefaults,
  normalizeTransportDefaults,
  writeTransportDefaults,
  type TransportDefaults,
} from "@/lib/data/transport-defaults";
import { isZip, normalizeZip } from "@/lib/geo/zip";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

function sameDefaults(a: TransportDefaults, b: TransportDefaults) {
  return a.deliveryZip === b.deliveryZip && a.rate === b.rate && a.pickup === b.pickup;
}

export function TransportDefaultsForm() {
  const [draft, setDraft] = useState<TransportDefaults>({
    deliveryZip: "",
    rate: "",
    pickup: "",
  });
  const [locked, setLocked] = useState<TransportDefaults | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    const stored = loadTransportDefaults();
    setDraft(stored);
    setLocked(stored);
  }, []);

  function edit(next: TransportDefaults) {
    setDraft(next);
    setSaveState("idle");
  }

  const zipOk = isZip(draft.deliveryZip);
  const dirty = !locked || !sameDefaults(normalizeTransportDefaults(draft), locked);

  function lockRates() {
    if (!zipOk) return;
    const next = writeTransportDefaults(draft);
    setDraft(next);
    setLocked(next);
    setSaveState("saved");
  }

  return (
    <div className="homeSettings">
      <div className="homeField">
        <label htmlFor="settings-delivery-zip">Delivery ZIP</label>
        <Input
          id="settings-delivery-zip"
          className="homeZip"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="17545"
          maxLength={5}
          value={draft.deliveryZip}
          onChange={(event) =>
            edit({ ...draft, deliveryZip: normalizeZip(event.target.value) })
          }
        />
        <small>{zipOk ? draft.deliveryZip : "Enter a 5-digit ZIP"}</small>
      </div>
      <div className="homeField">
        <label htmlFor="settings-rate">Per mile</label>
        <div className="homeMoney">
          <span aria-hidden>$</span>
          <Input
            id="settings-rate"
            inputMode="decimal"
            autoComplete="off"
            placeholder="1.35"
            value={draft.rate}
            onChange={(event) =>
              edit({ ...draft, rate: event.target.value.replace(/[^\d.]/g, "") })
            }
          />
        </div>
      </div>
      <div className="homeField">
        <label htmlFor="settings-pickup">Pickup fee</label>
        <div className="homeMoney">
          <span aria-hidden>$</span>
          <Input
            id="settings-pickup"
            inputMode="decimal"
            autoComplete="off"
            placeholder="95"
            value={draft.pickup}
            onChange={(event) =>
              edit({ ...draft, pickup: event.target.value.replace(/[^\d.]/g, "") })
            }
          />
        </div>
      </div>
      <button
        type="button"
        className={saveState === "saved" ? "homeTextBtn on homeSettingsSave" : "homeTextBtn homeSettingsSave"}
        disabled={!zipOk || (!dirty && saveState !== "saved")}
        onClick={lockRates}
      >
        {saveState === "saved" ? "Saved" : "Save"}
      </button>
      <p className="homeHint">
        {saveState === "saved"
          ? `Locked ${draft.deliveryZip} at $${draft.rate || "0"}/mi plus $${draft.pickup || "0"} pickup.`
          : "Save locks these rates on new Landed worksheets."}
      </p>
    </div>
  );
}
