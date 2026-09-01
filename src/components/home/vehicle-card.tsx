"use client";

import { catalogMakes, modelsForBrand, searchCatalog, trimsForModel, vehicleYears } from "@/lib/data/vehicle-catalog";
import { money } from "@/lib/format";
import type { VehicleLookup } from "@/lib/vehicles/types";
import { isVin, normalizeVin } from "@/lib/vehicles/vin";
import { MarketValueChart } from "@/components/home/market-value-chart";
import { Input } from "@/components/ui/input";
import { CircleX, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const YEARS = vehicleYears();
const DEFAULT_YEAR = String(new Date().getFullYear());

function commaMiles(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

async function readVehiclePayload(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text) as VehicleLookup & { error?: string };
  } catch {
    throw new Error("Could not look up that vehicle.");
  }
}

export function VehicleCard({
  brand,
  model,
  year,
  miles,
  trim,
  onBrand,
  onModel,
  onYear,
  onMiles,
  onTrim,
  onMarket,
}: {
  brand: string;
  model: string;
  year: string;
  miles: string;
  trim: string;
  onBrand: (next: string) => void;
  onModel: (next: string) => void;
  onYear: (next: string) => void;
  onMiles: (next: string) => void;
  onTrim: (next: string) => void;
  onMarket?: (next: {
    tradeInUsd?: number;
    wholesaleUsd?: number;
    retailUsd?: number;
  } | null) => void;
}) {
  const [vin, setVin] = useState("");
  const [makes, setMakes] = useState<{ id: number; name: string }[]>(catalogMakes);
  const [catalogModels, setCatalogModels] = useState<string[]>([]);
  const [catalogTrims, setCatalogTrims] = useState<string[]>([]);
  const [extraBrand, setExtraBrand] = useState("");
  const [extraModel, setExtraModel] = useState("");
  const [extraTrim, setExtraTrim] = useState("");
  const [lookup, setLookup] = useState<VehicleLookup | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const [autoClosed, setAutoClosed] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeHit, setActiveHit] = useState(0);
  const searchWrap = useRef<HTMLDivElement>(null);

  const brands = useMemo(() => {
    const names = makes.map((item) => item.name);
    if (extraBrand && !names.some((item) => item.toLowerCase() === extraBrand.toLowerCase())) {
      return [extraBrand, ...names];
    }
    return names;
  }, [makes, extraBrand]);

  const models = useMemo(() => {
    const listed = catalogModels.length ? catalogModels : modelsForBrand(brand);
    if (extraModel && !listed.some((item) => item.toLowerCase() === extraModel.toLowerCase())) {
      return [extraModel, ...listed];
    }
    return listed;
  }, [brand, catalogModels, extraModel]);

  const trims = useMemo(() => {
    const listed = catalogTrims.length ? catalogTrims : trimsForModel(brand, model);
    if (extraTrim && !listed.some((item) => item.toLowerCase() === extraTrim.toLowerCase())) {
      return [extraTrim, ...listed];
    }
    return listed;
  }, [brand, catalogTrims, extraTrim, model]);

  const hits = useMemo(() => {
    const q = search.trim();
    if (q) return searchCatalog(q);
    return brands.slice(0, 8).map((name) => ({
      kind: "brand" as const,
      brand: name,
      label: name,
    }));
  }, [brands, search]);

  const milesDigits = miles.replace(/\D/g, "");
  const milesReady = milesDigits.length > 0 && milesDigits !== "0";

  function pickHit(hit: (typeof hits)[number]) {
    onBrand(hit.brand);
    onModel("model" in hit ? (hit.model ?? "") : "");
    onTrim("");
    setSearch(hit.label);
    setSearchOpen(false);
  }

  useEffect(() => {
    fetch("/api/catalog/makes")
      .then((res) => res.json())
      .then((data) => setMakes(data.makes ?? []))
      .catch(() => setMakes([]));
  }, []);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!searchWrap.current?.contains(event.target as Node)) setSearchOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    if (!brand) {
      setCatalogModels([]);
      return;
    }
    setCatalogModels(modelsForBrand(brand));
    const makeId = makes.find((item) => item.name.toLowerCase() === brand.toLowerCase())?.id;
    const query = makeId
      ? `makeId=${makeId}${year ? `&year=${year}` : ""}`
      : `make=${encodeURIComponent(brand)}${year ? `&year=${year}` : ""}`;
    fetch(`/api/catalog/models?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.models?.length) setCatalogModels(data.models);
      })
      .catch(() => undefined);
  }, [brand, year, makes]);

  useEffect(() => {
    if (!brand || !model) {
      setCatalogTrims([]);
      return;
    }
    setCatalogTrims(trimsForModel(brand, model));
    const query = new URLSearchParams({ make: brand, model, ...(year ? { year } : {}) });
    fetch(`/api/catalog/trims?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.trims?.length) setCatalogTrims(data.trims);
      })
      .catch(() => undefined);
  }, [brand, model, year]);

  useEffect(() => {
    if (milesReady && brand && model && !year) onYear(DEFAULT_YEAR);
  }, [milesReady, brand, model, year, onYear]);

  useEffect(() => {
    const cleaned = normalizeVin(vin);
    if (!isVin(cleaned) || !milesReady) return;

    setStatus("loading");
    setError("");
    setLookup(null);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({ vin: cleaned, miles: milesDigits });
        const res = await fetch(`/api/vehicle?${query}`, { signal: controller.signal });
        const data = await readVehiclePayload(res);
        if (!res.ok) throw new Error(data.error || "Could not look up that vehicle.");
        setLookup(data);
        if (data.vehicle?.make) {
          setExtraBrand(data.vehicle.make);
          onBrand(data.vehicle.make);
        }
        if (data.vehicle?.model) {
          setExtraModel(data.vehicle.model);
          onModel(data.vehicle.model);
        }
        if (data.vehicle?.trim) {
          setExtraTrim(data.vehicle.trim);
          onTrim(data.vehicle.trim);
        }
        if (data.vehicle?.year) onYear(String(data.vehicle.year));
        setStatus("idle");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "Could not look up that vehicle.");
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [vin, milesDigits, milesReady, onBrand, onModel, onYear, onTrim]);

  useEffect(() => {
    if (isVin(vin) || !brand || !model || !milesReady) {
      if (!isVin(vin)) {
        setLookup(null);
        setStatus("idle");
        setError("");
      }
      return;
    }

    const yearToUse = year || DEFAULT_YEAR;
    setStatus("loading");
    setError("");
    setLookup(null);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          make: brand,
          model,
          year: yearToUse,
          miles: milesDigits,
          ...(trim ? { trim } : {}),
        });
        const res = await fetch(`/api/vehicle?${query}`, { signal: controller.signal });
        const data = await readVehiclePayload(res);
        if (!res.ok) throw new Error(data.error || "Could not look up that vehicle.");
        setLookup(data);
        setStatus("idle");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "Could not look up that vehicle.");
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [vin, brand, model, year, milesDigits, milesReady, trim]);

  const ready = Boolean((brand && model) || isVin(vin) || lookup?.vehicle);
  const showValues = milesReady && Boolean(ready || lookup || error || status === "loading");
  const title =
    [year || lookup?.vehicle?.year, brand || lookup?.vehicle?.make, model || lookup?.vehicle?.model]
      .filter(Boolean)
      .join(" ") || "Brand, model, year, miles";
  const collapsedLine = [title, miles && miles !== "0" ? `${commaMiles(miles)} mi` : null]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (showValues && lookup && status === "idle" && !autoClosed) {
      setOpen(false);
      setAutoClosed(true);
    }
    if (!showValues) {
      setOpen(true);
      setAutoClosed(false);
    }
  }, [showValues, lookup, status, autoClosed]);

  useEffect(() => {
    if (!onMarket) return;
    const market = lookup?.market;
    if (milesReady && status === "idle" && market?.wholesaleUsd != null) {
      onMarket({
        tradeInUsd: market.tradeInUsd,
        wholesaleUsd: market.wholesaleUsd,
        retailUsd: market.retailUsd,
      });
      return;
    }
    onMarket(null);
  }, [lookup, milesReady, onMarket, status]);

  function clearVehicle() {
    setVin("");
    setExtraBrand("");
    setExtraModel("");
    setExtraTrim("");
    setLookup(null);
    setError("");
    setStatus("idle");
    onBrand("");
    onModel("");
    onYear("");
    onMiles("0");
    onTrim("");
    setOpen(true);
    setAutoClosed(false);
  }

  const specBits = [
    lookup?.vehicle?.trim,
    lookup?.vehicle?.body_style,
    lookup?.vehicle?.drivetrain,
    lookup?.vehicle?.engine,
    lookup?.specifications?.displacement_l ? `${lookup.specifications.displacement_l}L` : null,
    lookup?.specifications?.engine_hp ? `${lookup.specifications.engine_hp} hp` : null,
  ].filter(Boolean);

  return (
    <>
      <section className="homeSheet homeVehicle">
        <div className={open ? "homeBlock" : "homeBlock is-collapsed"}>
          <div
            className="homeBlockHead"
            role="button"
            tabIndex={0}
            aria-expanded={open}
            onClick={() => setOpen((next) => !next)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen((next) => !next);
              }
            }}
          >
            <div>
              <h2>Vehicle</h2>
              <p>{status === "loading" ? "Looking up…" : open ? title : collapsedLine}</p>
            </div>
            <div className="homeBlockTools">
              <button
                type="button"
                className={open ? "homeTextBtn on" : "homeTextBtn"}
                aria-expanded={open}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen((next) => !next);
                }}
              >
                {open ? "Hide" : "Edit"}
              </button>
            </div>
          </div>
          {open ? (
          <div className="homeVehicleGrid">
            <div
              className="homeField homeVehicleSearch"
              ref={searchWrap}
              onMouseLeave={() => setSearchOpen(false)}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setSearchOpen(false);
              }}
            >
              <label htmlFor="vehicle-search">Search</label>
              <div className="homeVehicleSearchBox">
                <Search aria-hidden />
                <Input
                  id="vehicle-search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={searchOpen && hits.length > 0}
                  aria-controls="vehicle-search-list"
                  aria-activedescendant={
                    searchOpen && hits[activeHit] ? `vehicle-search-hit-${activeHit}` : undefined
                  }
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search brand or model"
                  value={search}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchOpen(true);
                    setActiveHit(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setSearchOpen(true);
                      setActiveHit((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)));
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveHit((index) => Math.max(index - 1, 0));
                    } else if (event.key === "Enter") {
                      if (searchOpen && hits[activeHit]) {
                        event.preventDefault();
                        pickHit(hits[activeHit]);
                      }
                    } else if (event.key === "Escape") {
                      setSearchOpen(false);
                    }
                  }}
                />
                {search ? (
                  <button
                    type="button"
                    className="homeVehicleSearchClear"
                    aria-label="Clear search"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearch("");
                      setActiveHit(0);
                      setSearchOpen(true);
                    }}
                  >
                    <CircleX aria-hidden />
                  </button>
                ) : null}
              </div>
              {searchOpen && hits.length > 0 ? (
                <ul id="vehicle-search-list" className="homeVehicleSuggest" role="listbox">
                  {hits.map((hit, index) => (
                    <li key={hit.kind === "brand" ? `b-${hit.brand}` : `m-${hit.brand}-${hit.model}`} role="none">
                      <button
                        type="button"
                        id={`vehicle-search-hit-${index}`}
                        role="option"
                        aria-selected={index === activeHit}
                        className={index === activeHit ? "on" : undefined}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pickHit(hit)}
                      >
                        <strong>{hit.kind === "brand" ? hit.brand : hit.model}</strong>
                        <small>{hit.kind === "brand" ? "Brand" : hit.brand}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="homeField homeVehicleVin">
              <label htmlFor="vehicle-vin">VIN</label>
              <Input
                id="vehicle-vin"
                className="homeZip"
                autoComplete="off"
                spellCheck={false}
                placeholder="1HGCM82633A004352"
                maxLength={17}
                value={vin}
                onChange={(event) => setVin(normalizeVin(event.target.value))}
              />
            </div>
            <div className="homeField">
              <label htmlFor="vehicle-brand">Brand</label>
              <select
                id="vehicle-brand"
                className="homeSelect"
                value={brand}
                onChange={(event) => {
                  const next = event.target.value;
                  onBrand(next);
                  onModel("");
                  onTrim("");
                }}
              >
                <option value="">Brand</option>
                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="homeField">
              <label htmlFor="vehicle-model">Model</label>
              <select
                id="vehicle-model"
                className="homeSelect"
                value={model}
                disabled={!brand}
                onChange={(event) => {
                  onModel(event.target.value);
                  onTrim("");
                }}
              >
                <option value="">Model</option>
                {models.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="homeField">
              <label htmlFor="vehicle-year">Year</label>
              <select
                id="vehicle-year"
                className="homeSelect"
                value={year}
                onChange={(event) => onYear(event.target.value)}
              >
                <option value="">Year</option>
                {year && !YEARS.includes(year) ? <option value={year}>{year}</option> : null}
                {YEARS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="homeField homeVehicleTrim">
              <label htmlFor="vehicle-trim">Trim</label>
              <select
                id="vehicle-trim"
                className="homeSelect"
                value={trim}
                disabled={!brand || !model}
                onChange={(event) => onTrim(event.target.value)}
              >
                <option value="">Trim</option>
                {trim && !trims.includes(trim) ? <option value={trim}>{trim}</option> : null}
                {trims.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="homeField homeVehicleMiles">
              <label htmlFor="vehicle-miles">Miles</label>
              <Input
                id="vehicle-miles"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={commaMiles(miles)}
                onFocus={(event) => {
                  if (miles === "0" || miles === "") event.currentTarget.select();
                }}
                onChange={(event) => onMiles(event.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  if (!miles) onMiles("0");
                }}
              />
            </div>
          </div>
          ) : null}
        </div>
      </section>

      {showValues ? (
      <section className="homeSheet homeLookup">
          <div className="homeBlock">
            <div className="homeBlockHead">
              <div>
                <h2>Market value</h2>
                <p>
                  {status === "loading"
                    ? "Trade-in · wholesale · retail…"
                    : lookup?.market?.retailUsd != null
                      ? lookup.market.source === "listings"
                        ? "From live listings"
                        : lookup.market.source === "depreciation"
                          ? "From model depreciation"
                          : "From dealer asking"
                      : lookup?.marketError
                        ? "No market values for this vehicle"
                        : error
                          ? "Could not reach Vehicles.dev"
                          : "Choose brand, model, and year"}
                </p>
              </div>
              <div className="homeBlockTools">
                <button type="button" className="homeTextBtn" onClick={clearVehicle}>
                  Clear
                </button>
                {lookup?.market?.wholesaleUsd != null ? <b>{money(lookup.market.wholesaleUsd)}</b> : null}
              </div>
            </div>
            {error ? (
              <p className="homeHint">{error}</p>
            ) : lookup ? (
              <>
                {lookup.photoUrl ? (
                  <div className="homeVehiclePhoto">
                    <img
                      src={lookup.photoUrl}
                      alt={[lookup.vehicle?.year, lookup.vehicle?.make, lookup.vehicle?.model]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  </div>
                ) : null}
                <ul className="homeBreakdown">
                  {lookup.vehicle?.year || lookup.vehicle?.make || lookup.vehicle?.model ? (
                    <li>
                      <span>Decoded</span>
                      <b>
                        {[lookup.vehicle?.year, lookup.vehicle?.make, lookup.vehicle?.model]
                          .filter(Boolean)
                          .join(" ")}
                      </b>
                    </li>
                  ) : null}
                  {lookup.market?.tradeInUsd != null &&
                  lookup.market.wholesaleUsd != null &&
                  lookup.market.retailUsd != null ? (
                    <li className="homeValueRow">
                      <MarketValueChart
                        tradeIn={lookup.market.tradeInUsd}
                        wholesale={lookup.market.wholesaleUsd}
                        retail={lookup.market.retailUsd}
                      />
                    </li>
                  ) : (
                    <>
                      <li>
                        <span>Trade-in</span>
                        <b>—</b>
                      </li>
                      <li>
                        <span>Wholesale</span>
                        <b>—</b>
                      </li>
                      <li>
                        <span>Retail</span>
                        <b>—</b>
                      </li>
                    </>
                  )}
                  {lookup.recalls ? (
                    <li>
                      <span>Recalls</span>
                      <b>
                        {lookup.recalls.count === 0
                          ? "None listed"
                          : `${lookup.recalls.count} open`}
                      </b>
                    </li>
                  ) : null}
                </ul>
                {lookup.marketError ? <p className="homeHint">{lookup.marketError}</p> : null}
                {specBits.length > 0 ? <p className="homeHint">{specBits.join(" · ")}</p> : null}
                {lookup.recalls?.items.slice(0, 4).map((item, index) => (
                  <p key={item.campaign_number || index} className="homeHint">
                    {[item.campaign_number, item.component, item.summary].filter(Boolean).join(" — ")}
                  </p>
                ))}
              </>
            ) : (
              <ul className="homeBreakdown">
                <li>
                  <span>Trade-in</span>
                  <b>{status === "loading" ? "…" : "—"}</b>
                </li>
                <li>
                  <span>Wholesale</span>
                  <b>{status === "loading" ? "…" : "—"}</b>
                </li>
                <li>
                  <span>Retail</span>
                  <b>{status === "loading" ? "…" : "—"}</b>
                </li>
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
