"use client";

import { formatDateTime, miles as formatMiles, moneyExact, pct } from "@/lib/format";
import {
  deleteWorksheet,
  queueWorksheetEdit,
  worksheetsByKind,
  type SavedWorksheet,
  type WorksheetKind,
} from "@/lib/data/worksheets";
import { Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function milesLine(value: string) {
  if (!value || value === "0") return null;
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString("en-US")} mi` : null;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <span>{label}</span>
      <b>{value}</b>
    </li>
  );
}

export function WorksheetList({
  kind,
  empty,
}: {
  kind: WorksheetKind;
  empty: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<SavedWorksheet[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const titleId = useId();
  const open = items.find((item) => item.id === openId) ?? null;

  function goHome() {
    const query = typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
    router.push(query ? `/?${query}` : "/");
  }

  function editItem(id: string) {
    queueWorksheetEdit(id);
    goHome();
  }

  function removeItem(id: string) {
    const next = deleteWorksheet(id);
    setItems(next.filter((item) => item.kind === kind));
    setOpenId((current) => (current === id ? null : current));
  }

  useEffect(() => {
    setItems(worksheetsByKind(kind));
  }, [kind]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!items.length) return <p className="homeHint">{empty}</p>;

  return (
    <>
      <ul className="homeLotList">
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="homeLotRow" onClick={() => setOpenId(item.id)}>
              <div className="homeLotCopy">
                <strong>{item.title}</strong>
                <small>
                  {[item.trim, milesLine(item.miles), when(item.createdAt)].filter(Boolean).join(" · ")}
                </small>
              </div>
              <b>{moneyExact(item.landed)}</b>
            </button>
            <div className="homeLotRowTools">
              <button
                type="button"
                className="homeLotEdit"
                aria-label={`Edit ${item.title}`}
                onClick={() => editItem(item.id)}
              >
                <Pencil aria-hidden />
              </button>
              <button
                type="button"
                className="homeLotDelete"
                aria-label={`Delete ${item.title}`}
                onClick={() => removeItem(item.id)}
              >
                <Trash2 aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open ? (
        <div
          className="homeLotOverlay"
          onClick={() => setOpenId(null)}
        >
          <div
            className="homeLotSheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="homeLotSheetHead">
              <div>
                <p className="homeLotKind">{open.kind === "buy" ? "Buy" : "Watch"}</p>
                <h3 id={titleId}>{open.title}</h3>
                <small>{formatDateTime(open.createdAt)}</small>
              </div>
              <div className="homeLotTools">
                <button
                  type="button"
                  className="homeLotDelete"
                  aria-label="Delete this unit"
                  onClick={() => removeItem(open.id)}
                >
                  <Trash2 aria-hidden />
                </button>
                <button
                  type="button"
                  className="homeLotEdit"
                  onClick={() => editItem(open.id)}
                >
                  <Pencil aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  className="homeLotClose"
                  aria-label="Close details"
                  onClick={() => setOpenId(null)}
                >
                  <X aria-hidden />
                  Close
                </button>
              </div>
            </div>
            <ul className="homeBreakdown">
              {open.trim ? <Detail label="Trim" value={open.trim} /> : null}
              <Detail label="Miles" value={milesLine(open.miles) ?? "—"} />
              <Detail label="Buying" value={moneyExact(Number(open.buyPrice) || 0)} />
              <Detail
                label="Auction"
                value={
                  open.auctionName
                    ? `${open.auctionName} · ${pct(Number(open.auctionPercent) || 0)}`
                    : pct(Number(open.auctionPercent) || 0)
                }
              />
              <Detail label="Auction fee" value={moneyExact(open.auctionFee)} />
              <Detail
                label="Route"
                value={
                  open.pickupZip || open.deliveryZip
                    ? `${open.pickupZip || "—"} → ${open.deliveryZip || "—"}`
                    : "—"
                }
              />
              <Detail
                label="Transport"
                value={
                  open.routeMiles && open.routeMiles !== "0"
                    ? `${formatMiles(Number(open.routeMiles))} · ${moneyExact(open.transportFee)}`
                    : moneyExact(open.transportFee)
                }
              />
              <Detail label="Landed" value={moneyExact(open.landed)} />
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
