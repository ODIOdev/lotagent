"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoneyInput, NumberInput } from "@/components/money-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateTransportEstimate } from "@/lib/calc/fees";
import { upsertLocation, upsertTransport } from "@/lib/data/demo-store";
import { useAppState } from "@/lib/data/use-app-state";
import { getProviders } from "@/lib/providers";
import { money, uid } from "@/lib/format";
import type { SavedLocation, TransportStatus } from "@/lib/types";

const STATUSES: TransportStatus[] = ["not_scheduled", "scheduled", "picked_up", "in_transit", "delivered"];

export default function TransportationPage() {
  const state = useAppState();
  const defaultDest = state.savedLocations.find((item) => item.id === state.dealership.defaultDestinationId) ?? state.savedLocations[0];
  const [pickupZip, setPickupZip] = useState("17545");
  const [deliveryZip, setDeliveryZip] = useState(defaultDest?.zip ?? "17545");
  const [distance, setDistance] = useState(85);
  const [rate, setRate] = useState(state.settings.defaultTransportationRate);
  const [flat, setFlat] = useState(95);
  const [inoperable, setInoperable] = useState(0);
  const [enclosed, setEnclosed] = useState(0);
  const [urgent, setUrgent] = useState(0);
  const [tolls, setTolls] = useState(28);
  const [carrier, setCarrier] = useState("Keystone Auto Haul");
  const total = useMemo(
    () =>
      calculateTransportEstimate({
        distance,
        costPerMile: rate,
        flatPickupCharge: flat,
        inoperableSurcharge: inoperable,
        enclosedSurcharge: enclosed,
        urgentSurcharge: urgent,
        tollEstimate: tolls,
      }),
    [distance, rate, flat, inoperable, enclosed, urgent, tolls],
  );

  async function estimateMiles() {
    const result = await getProviders().mileage(pickupZip, deliveryZip);
    setDistance(result.miles);
    toast.message(`Demo mileage adapter: ${result.miles} miles. Connect a maps API later.`);
  }

  function saveEstimate() {
    upsertTransport({
      id: uid("tr"),
      worksheetId: null,
      pickupZip,
      deliveryZip,
      estimatedDistance: distance,
      costPerMile: rate,
      flatPickupCharge: flat,
      inoperableSurcharge: inoperable,
      enclosedSurcharge: enclosed,
      urgentSurcharge: urgent,
      tollEstimate: tolls,
      carrierName: carrier,
      pickupStatus: "not_scheduled",
      deliveryStatus: "not_scheduled",
      notes: "Saved from transportation calculator",
    });
    toast.success("Transportation estimate saved.");
  }

  function saveLocation(kind: SavedLocation["kind"]) {
    const name = prompt("Location name");
    if (!name) return;
    upsertLocation({
      id: uid("loc"),
      name,
      kind,
      zip: deliveryZip,
      address: "",
    });
    toast.success("Destination saved.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Transportation</h1>
        <p className="text-sm text-muted-foreground">
          Estimate = distance × rate + surcharges + tolls. Sample rates — verify with your carrier.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Estimator</CardTitle>
            <CardDescription>Enter ZIP codes or distance manually when no maps API is configured.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Pickup ZIP</Label>
              <Input value={pickupZip} onChange={(event) => setPickupZip(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Delivery ZIP</Label>
              <Input value={deliveryZip} onChange={(event) => setDeliveryZip(event.target.value)} />
            </div>
            <NumberInput id="dist" label="Estimated distance (miles)" value={distance} onChange={setDistance} />
            <MoneyInput id="rate" label="Cost per mile" value={rate} onChange={setRate} />
            <MoneyInput id="flat" label="Flat pickup charge" value={flat} onChange={setFlat} />
            <MoneyInput id="inop" label="Inoperable surcharge" value={inoperable} onChange={setInoperable} />
            <MoneyInput id="enc" label="Enclosed surcharge" value={enclosed} onChange={setEnclosed} />
            <MoneyInput id="urg" label="Urgent surcharge" value={urgent} onChange={setUrgent} />
            <MoneyInput id="toll" label="Toll estimate" value={tolls} onChange={setTolls} />
            <div className="grid gap-1.5">
              <Label>Carrier</Label>
              <Input value={carrier} onChange={(event) => setCarrier(event.target.value)} />
            </div>
            <div className="col-span-full flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void estimateMiles()}>
                Estimate distance
              </Button>
              <Button type="button" onClick={saveEstimate}>
                Save estimate
              </Button>
              <Button type="button" variant="outline" onClick={() => saveLocation("dealership")}>
                Save destination
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Total estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-4xl font-semibold">{money(total)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {distance} mi × {money(rate)} + pickup {money(flat)} + surcharges{" "}
              {money(inoperable + enclosed + urgent)} + tolls {money(tolls)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Saved destinations</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {state.savedLocations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="rounded-lg border p-3 text-left hover:border-primary"
              onClick={() => setDeliveryZip(loc.zip)}
            >
              <p className="font-medium">{loc.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{loc.kind.replaceAll("_", " ")} · {loc.zip}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Active loads</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                {["Carrier", "From", "To", "Miles", "Estimate", "Pickup", "Delivery"].map((h) => (
                  <th key={h} className="px-2 py-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.transports.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-2">{item.carrierName}</td>
                  <td className="px-2 py-2">{item.pickupZip}</td>
                  <td className="px-2 py-2">{item.deliveryZip}</td>
                  <td className="tabular px-2 py-2">{item.estimatedDistance}</td>
                  <td className="tabular px-2 py-2">
                    {money(
                      calculateTransportEstimate({
                        distance: item.estimatedDistance,
                        costPerMile: item.costPerMile,
                        flatPickupCharge: item.flatPickupCharge,
                        inoperableSurcharge: item.inoperableSurcharge,
                        enclosedSurcharge: item.enclosedSurcharge,
                        urgentSurcharge: item.urgentSurcharge,
                        tollEstimate: item.tollEstimate,
                      }),
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      value={item.pickupStatus}
                      onValueChange={(value) => upsertTransport({ ...item, pickupStatus: value as TransportStatus })}
                    >
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      value={item.deliveryStatus}
                      onValueChange={(value) => upsertTransport({ ...item, deliveryStatus: value as TransportStatus })}
                    >
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
