"use client";

import { moneyExact } from "@/lib/format";
import { worksheetsByKind, type WorksheetKind } from "@/lib/data/worksheets";
import { useEffect, useState } from "react";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function WorksheetList({
  kind,
  empty,
}: {
  kind: WorksheetKind;
  empty: string;
}) {
  const [items, setItems] = useState<ReturnType<typeof worksheetsByKind>>([]);

  useEffect(() => {
    setItems(worksheetsByKind(kind));
  }, [kind]);

  if (!items.length) return <p className="homeHint">{empty}</p>;

  return (
    <ul className="homeLotList">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <small>
              {[item.trim, item.miles && item.miles !== "0" ? `${Number(item.miles).toLocaleString()} mi` : null, when(item.createdAt)]
                .filter(Boolean)
                .join(" · ")}
            </small>
          </div>
          <b>{moneyExact(item.landed)}</b>
        </li>
      ))}
    </ul>
  );
}
