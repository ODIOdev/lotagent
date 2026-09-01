"use client";

import { calculateTransportEstimate } from "@/lib/calc/fees";
import { projectedProfit, roiPercent } from "@/lib/calc/acquisition";
import { moneyNum, roundMoney } from "@/lib/calc/money";
import {
  loadAuctionStore,
  percentForAuction,
  writeAuctionStore,
} from "@/lib/data/auction-percents";
import {
  DEFAULT_DELIVERY_ZIP,
  DEFAULT_PICKUP,
  DEFAULT_RATE,
  loadTransportDefaults,
} from "@/lib/data/transport-defaults";
import { FEE_PRESETS } from "@/lib/data/fee-presets";
import { moneyExact, miles as formatMiles, pct, signedMoney } from "@/lib/format";
import { isZip, normalizeZip, type ZipPlace } from "@/lib/geo/zip";
import { VehicleCard } from "@/components/home/vehicle-card";
import {
  clearWorksheetEdit,
  getWorksheet,
  saveWorksheet,
  takeQueuedEdit,
  updateWorksheet,
} from "@/lib/data/worksheets";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LOW_PROFIT_USD = 500;
const LOW_ROI_PERCENT = 8;

function auctionLabel(name: string) {
  return name.replace(" (sample)", "");
}

function roiTone(roi: number | null, profit: number) {
  if (roi == null) return undefined;
  if (roi < 0 || profit < 0) return "is-down";
  if (profit < LOW_PROFIT_USD || roi < LOW_ROI_PERCENT) return "is-low";
  return "is-up";
}

type ZipRoutePayload = {
  miles?: number;
  from?: ZipPlace;
  to?: ZipPlace;
  error?: string;
};

function distanceErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (!message || /unexpected token|not valid json|<!doctype/i.test(message)) {
    return "Could not measure that route.";
  }
  return message;
}

async function readZipRoute(origin: string, dest: string, signal: AbortSignal) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 350 * attempt));
    }
    try {
      const res = await fetch(`/api/zip-distance?from=${origin}&to=${dest}`, { signal });
      const text = await res.text();
      let data: ZipRoutePayload;
      try {
        data = JSON.parse(text) as ZipRoutePayload;
      } catch {
        lastError = new Error("Could not measure that route.");
        continue;
      }
      if (!res.ok) throw new Error(data.error || "Could not measure that route.");
      return data;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = new Error(distanceErrorMessage(error));
      if (error instanceof Error && /was not found|5-digit/i.test(error.message)) {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error("Could not measure that route.");
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "",
  large,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  large?: boolean;
}) {
  return (
    <div className={large ? "homeMoney homeMoneyLarge" : "homeMoney"}>
      <span aria-hidden>$</span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))}
      />
    </div>
  );
}

function PercentInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="homeMoney">
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder="5"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))}
      />
      <em>%</em>
    </div>
  );
}

function placeLine(place: ZipPlace | null, zip: string, empty: string) {
  if (place && place.zip === zip) return `${place.city}, ${place.state}`;
  if (isZip(zip)) return zip;
  return empty;
}

export function LandedWorksheet() {
  const router = useRouter();
  const [sheetKey, setSheetKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [buyPrice, setBuyPrice] = useState("");
  const [scheduleId, setScheduleId] = useState(FEE_PRESETS[0]?.id ?? "fee-manheim");
  const [auctionPercent, setAuctionPercent] = useState("5");
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [auctionOpen, setAuctionOpen] = useState(false);
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMiles, setVehicleMiles] = useState("0");
  const [vehicleTrim, setVehicleTrim] = useState("");
  const [vehicleMarket, setVehicleMarket] = useState<{
    tradeInUsd?: number;
    wholesaleUsd?: number;
    retailUsd?: number;
  } | null>(null);

  const [pickupZip, setPickupZip] = useState("");
  const [deliveryZip, setDeliveryZip] = useState(DEFAULT_DELIVERY_ZIP);
  const [pickupPlace, setPickupPlace] = useState<ZipPlace | null>(null);
  const [deliveryPlace, setDeliveryPlace] = useState<ZipPlace | null>(null);
  const [miles, setMiles] = useState("");
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [pickupCharge, setPickupCharge] = useState(DEFAULT_PICKUP);
  const [transportOverride, setTransportOverride] = useState(false);
  const [transportManual, setTransportManual] = useState("");
  const [distanceStatus, setDistanceStatus] = useState<"idle" | "loading" | "error">("idle");
  const [distanceError, setDistanceError] = useState("");

  const bid = moneyNum(buyPrice);
  const schedule = FEE_PRESETS.find((item) => item.id === scheduleId) ?? FEE_PRESETS[0];
  const auctionFee = roundMoney(bid * (moneyNum(auctionPercent) / 100));
  const buyWithAuction = roundMoney(bid + auctionFee);

  const distance = moneyNum(miles);
  const estimatedTransport = calculateTransportEstimate({
    distance,
    costPerMile: moneyNum(rate),
    flatPickupCharge: moneyNum(pickupCharge),
    inoperableSurcharge: 0,
    enclosedSurcharge: 0,
    urgentSurcharge: 0,
    tollEstimate: 0,
  });
  const routeReady = isZip(normalizeZip(pickupZip)) && isZip(normalizeZip(deliveryZip));
  const transportFee = transportOverride
    ? moneyNum(transportManual)
    : distance > 0 || routeReady
      ? estimatedTransport
      : 0;
  const landed = roundMoney(bid + auctionFee + transportFee);
  const wholesale = vehicleMarket?.wholesaleUsd;
  const sellEstimate = wholesale != null ? wholesale : 0;
  const profitEstimate = wholesale != null ? projectedProfit(wholesale, landed) : 0;
  const roiEstimate = wholesale != null && landed > 0 ? roiPercent(profitEstimate, landed) : null;
  const tradeRoi =
    vehicleMarket?.tradeInUsd != null && landed > 0
      ? roiPercent(projectedProfit(vehicleMarket.tradeInUsd, landed), landed)
      : null;
  const retailRoi =
    vehicleMarket?.retailUsd != null && landed > 0
      ? roiPercent(projectedProfit(vehicleMarket.retailUsd, landed), landed)
      : null;

  function go(path: string) {
    const query = typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
    router.push(query ? `${path}?${query}` : path);
  }

  function snapshot(kind: "buy" | "watch") {
    const entry = {
      kind,
      title:
        [vehicleYear, vehicleBrand, vehicleModel].filter(Boolean).join(" ") || "Untitled lot",
      brand: vehicleBrand,
      model: vehicleModel,
      year: vehicleYear,
      miles: vehicleMiles,
      trim: vehicleTrim,
      buyPrice,
      auctionPercent,
      auctionName: auctionLabel(schedule.name),
      pickupZip,
      deliveryZip,
      routeMiles: miles,
      auctionFee,
      transportFee,
      landed,
    };
    const record = editingId ? updateWorksheet(editingId, entry) : saveWorksheet(entry);
    setEditingId(null);
    clearWorksheetEdit();
    return record;
  }

  function passSheet() {
    setBuyPrice("");
    setVehicleBrand("");
    setVehicleModel("");
    setVehicleYear("");
    setVehicleMiles("0");
    setVehicleTrim("");
    setVehicleMarket(null);
    setPickupZip("");
    const transport = loadTransportDefaults();
    setDeliveryZip(transport.deliveryZip);
    setPickupPlace(null);
    setDeliveryPlace(null);
    setMiles("");
    setRate(transport.rate);
    setPickupCharge(transport.pickup);
    setTransportOverride(false);
    setTransportManual("");
    setDistanceStatus("idle");
    setDistanceError("");
    setAuctionOpen(false);
    setEditingId(null);
    clearWorksheetEdit();
    setSheetKey((value) => value + 1);
  }

  useEffect(() => {
    const store = loadAuctionStore();
    setScheduleId(store.selected);
    setAuctionPercent(percentForAuction(store, store.selected));
    const transport = loadTransportDefaults();
    setDeliveryZip(transport.deliveryZip);
    setRate(transport.rate);
    setPickupCharge(transport.pickup);

    const editId = takeQueuedEdit();
    if (!editId) return;
    const item = getWorksheet(editId);
    if (!item) return;
    setEditingId(item.id);
    setBuyPrice(item.buyPrice);
    setVehicleBrand(item.brand);
    setVehicleModel(item.model);
    setVehicleYear(item.year);
    setVehicleMiles(item.miles || "0");
    setVehicleTrim(item.trim);
    setPickupZip(item.pickupZip);
    setDeliveryZip(item.deliveryZip || transport.deliveryZip);
    setMiles(item.routeMiles);
    setAuctionPercent(item.auctionPercent);
    const match = FEE_PRESETS.find(
      (preset) => auctionLabel(preset.name) === item.auctionName || preset.name === item.auctionName,
    );
    if (match) setScheduleId(match.id);
    setSheetKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const from = normalizeZip(pickupZip);
    const to = normalizeZip(deliveryZip);
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setDistanceError("");
      try {
        if (isZip(from) && isZip(to)) {
          setDistanceStatus("loading");
          const data = await readZipRoute(from, to, controller.signal);
          if (typeof data.miles !== "number") throw new Error("Could not measure that route.");
          setMiles(String(data.miles));
          setPickupPlace(data.from ?? null);
          setDeliveryPlace(data.to ?? null);
          setDistanceStatus("idle");
          return;
        }

        setMiles("");
        setDistanceStatus("idle");
        if (isZip(from)) {
          const data = await readZipRoute(from, from, controller.signal);
          setPickupPlace(data.from ?? null);
        } else {
          setPickupPlace(null);
        }
        if (isZip(to)) {
          const data = await readZipRoute(to, to, controller.signal);
          setDeliveryPlace(data.from ?? data.to ?? null);
        } else {
          setDeliveryPlace(null);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setDistanceStatus("error");
        setDistanceError(distanceErrorMessage(error));
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [pickupZip, deliveryZip]);

  const pickupReady = isZip(normalizeZip(pickupZip));
  const deliveryReady = isZip(normalizeZip(deliveryZip));
  const distanceNote =
    distanceStatus === "loading"
      ? "Measuring…"
      : distanceError
        ? distanceError
        : distance > 0 || (routeReady && miles === "0")
          ? formatMiles(distance)
          : deliveryReady && !pickupReady
            ? "Enter pickup ZIP"
            : pickupReady && !deliveryReady
              ? "Enter delivery ZIP"
              : "Enter both ZIPs";

  return (
    <>
      <header className="homeHead">
        <p className="homeMark">LOTAGENT</p>
      </header>

      <div className="homeGrid">
        <VehicleCard
          key={sheetKey}
          brand={vehicleBrand}
          model={vehicleModel}
          year={vehicleYear}
          miles={vehicleMiles}
          trim={vehicleTrim}
          onBrand={setVehicleBrand}
          onModel={setVehicleModel}
          onYear={setVehicleYear}
          onMiles={setVehicleMiles}
          onTrim={setVehicleTrim}
          onMarket={setVehicleMarket}
        />

        <div className="homeSheet">
          <section className="homeBlock homeBuy">
            <div className="homeBlockHead">
              <div>
                <h2>Buying price</h2>
                <p>Hammer + auction</p>
              </div>
              <div className="homeBlockTools">
                <button type="button" className="homeTextBtn" onClick={() => setBuyPrice("")}>
                  Clear
                </button>
                <b>{moneyExact(buyWithAuction)}</b>
              </div>
            </div>
            <label className="homeSrOnly" htmlFor="buy-price">
              Buying price
            </label>
            <MoneyInput id="buy-price" value={buyPrice} onChange={setBuyPrice} large />
          </section>

          <section className={auctionOpen ? "homeBlock" : "homeBlock is-collapsed"}>
            <div
              className="homeBlockHead"
              role="button"
              tabIndex={0}
              aria-expanded={auctionOpen}
              onClick={() => setAuctionOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setAuctionOpen((open) => !open);
                }
              }}
            >
              <div>
                <h2>Auction fee</h2>
                <p>
                  {auctionOpen
                    ? "Percent saved per house"
                    : `${auctionLabel(schedule.name)} · ${auctionPercent || 0}%`}
                </p>
              </div>
              <div className="homeBlockTools">
                <button
                  type="button"
                  className={auctionOpen ? "homeTextBtn on" : "homeTextBtn"}
                  aria-expanded={auctionOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    setAuctionOpen((open) => !open);
                  }}
                >
                  {auctionOpen ? "Hide" : "Edit"}
                </button>
                <b>{moneyExact(auctionFee)}</b>
              </div>
            </div>
            {auctionOpen ? (
              <>
                <div className="homeField">
                  <label htmlFor="auction-house">House</label>
                  <select
                    id="auction-house"
                    className="homeSelect"
                    value={scheduleId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const store = loadAuctionStore();
                      setScheduleId(nextId);
                      setAuctionPercent(percentForAuction(store, nextId));
                      setSaveState("idle");
                      writeAuctionStore({ ...store, selected: nextId });
                    }}
                  >
                    {FEE_PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {auctionLabel(item.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="homeSaveRow">
                  <div className="homeField">
                    <label htmlFor="auction-fee">Rate</label>
                    <PercentInput
                      id="auction-fee"
                      value={auctionPercent}
                      onChange={(next) => {
                        setAuctionPercent(next);
                        setSaveState("idle");
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={saveState === "saved" ? "homeTextBtn on" : "homeTextBtn"}
                    onClick={() => {
                      const store = loadAuctionStore();
                      writeAuctionStore({
                        selected: scheduleId,
                        percents: { ...store.percents, [scheduleId]: auctionPercent || "0" },
                      });
                      setSaveState("saved");
                    }}
                  >
                    {saveState === "saved" ? "Saved" : "Update"}
                  </button>
                </div>
                <p className="homeHint">
                  {saveState === "saved"
                    ? `Saved ${auctionPercent || 0}% to ${auctionLabel(schedule.name)}`
                    : bid > 0
                      ? `${moneyNum(auctionPercent) || 0}% × ${moneyExact(bid)}`
                      : "Update saves this rate to the selected house"}
                </p>
              </>
            ) : null}
          </section>

          <section className="homeBlock homeTransport">
            <div className="homeBlockHead">
              <div>
                <h2>Transportation</h2>
                <p>ZIP to ZIP</p>
              </div>
              <div className="homeBlockTools">
                <button
                  type="button"
                  className={transportOverride ? "homeTextBtn on" : "homeTextBtn"}
                  onClick={() => {
                    setTransportOverride((open) => {
                      const next = !open;
                      if (next && !transportManual) setTransportManual(String(estimatedTransport || ""));
                      return next;
                    });
                  }}
                >
                  {transportOverride ? "Miles" : "Flat fee"}
                </button>
                <b>{moneyExact(transportFee)}</b>
              </div>
            </div>

            {transportOverride ? (
              <div className="homeField">
                <label htmlFor="transport-fee">Transport fee</label>
                <MoneyInput id="transport-fee" value={transportManual} onChange={setTransportManual} />
              </div>
            ) : (
              <>
                <div className="homeRoute">
                  <div className="homeField">
                    <label htmlFor="pickup-zip">Pickup</label>
                    <Input
                      id="pickup-zip"
                      className="homeZip"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="33166"
                      maxLength={5}
                      value={pickupZip}
                      onChange={(event) => setPickupZip(normalizeZip(event.target.value))}
                    />
                    <small>{placeLine(pickupPlace, pickupZip, "Auction")}</small>
                  </div>
                  <span className="homeRouteArrow" aria-hidden />
                  <div className="homeField">
                    <label htmlFor="delivery-zip">Delivery</label>
                    <Input
                      id="delivery-zip"
                      className="homeZip"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="17545"
                      maxLength={5}
                      value={deliveryZip}
                      onChange={(event) => setDeliveryZip(normalizeZip(event.target.value))}
                    />
                    <small>{placeLine(deliveryPlace, deliveryZip, "Lot")}</small>
                  </div>
                </div>
                <div className="homeRateRow">
                  <div className={`homeMiles${distanceStatus === "loading" ? " is-loading" : ""}`}>
                    <em>Miles</em>
                    <strong>{distanceNote}</strong>
                  </div>
                  <div className="homeField">
                    <label htmlFor="rate-per-mile">Per mile</label>
                    <div className="homeMoney">
                      <span aria-hidden>$</span>
                      <Input
                        id="rate-per-mile"
                        inputMode="decimal"
                        autoComplete="off"
                        value={rate}
                        onChange={(event) => setRate(event.target.value.replace(/[^\d.]/g, ""))}
                      />
                    </div>
                  </div>
                  <div className="homeField">
                    <label htmlFor="pickup-charge">Pickup</label>
                    <MoneyInput id="pickup-charge" value={pickupCharge} onChange={setPickupCharge} />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="homeDecide">
          <button
            type="button"
            className="homeDecideBuy"
            onClick={() => {
              snapshot("buy");
              go("/buys");
            }}
          >
            Buy
          </button>
          <button type="button" className="homeDecidePass" onClick={passSheet}>
            Pass
          </button>
          <button
            type="button"
            className="homeDecideDraft"
            onClick={() => {
              snapshot("watch");
              go("/watch");
            }}
          >
            Watch
          </button>
        </div>

        <aside className="homeTicket">
          <h1 className="homeTicketKicker">Landed cost</h1>
          <p className="homeTicketTotal">{moneyExact(landed)}</p>
          <dl>
            <div>
              <dt>Buying</dt>
              <dd>{moneyExact(bid)}</dd>
            </div>
            <div>
              <dt>Auction</dt>
              <dd>{moneyExact(auctionFee)}</dd>
            </div>
            <div>
              <dt>Transport</dt>
              <dd>{moneyExact(transportFee)}</dd>
            </div>
          </dl>
          <div className="homeTicketRoi">
            <div className="homeTicketRoiHead">
              <p>Potential ROI</p>
              <b className={roiTone(roiEstimate, profitEstimate)}>
                {roiEstimate == null ? "—" : pct(roiEstimate)}
              </b>
            </div>
            {wholesale != null && landed > 0 ? (
              <>
                <ul>
                  <li>
                    <span>Est. sell</span>
                    <b>{moneyExact(sellEstimate)}</b>
                  </li>
                  <li>
                    <span>Landed</span>
                    <b>{moneyExact(landed)}</b>
                  </li>
                  <li>
                    <span>Profit</span>
                    <b className={roiTone(roiEstimate, profitEstimate)}>{signedMoney(profitEstimate)}</b>
                  </li>
                </ul>
                <small>
                  Wholesale − (buy + auction + transport).
                  {tradeRoi != null || retailRoi != null
                    ? ` Trade-in ${tradeRoi == null ? "—" : pct(tradeRoi)} · Retail ${retailRoi == null ? "—" : pct(retailRoi)}.`
                    : ""}
                </small>
              </>
            ) : (
              <small>
                {wholesale == null
                  ? vehicleBrand && vehicleModel && vehicleMiles.replace(/\D/g, "") && vehicleMiles !== "0"
                    ? "Fetching market values…"
                    : "Add a vehicle for a market estimate."
                  : "Enter a buy price to estimate ROI."}
              </small>
            )}
          </div>
        </aside>
      </div>

    </>
  );
}
