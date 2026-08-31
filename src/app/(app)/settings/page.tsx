"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCsv, exportStateCsv, resetDemoData, updateDealership, updateProfile, updateSettings } from "@/lib/data/demo-store";
import { useAppState } from "@/lib/data/use-app-state";
import { isDemoMode } from "@/lib/env";
import { MoneyInput, NumberInput } from "@/components/money-input";

export default function SettingsPage() {
  const state = useAppState();
  const [profile, setProfile] = useState(state.profile);
  const [dealership, setDealership] = useState(state.dealership);
  const [settings, setSettings] = useState(state.settings);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Defaults feed new worksheets and the decision engine. {isDemoMode() ? "Demo mode is active." : "Supabase is configured."}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>User profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={profile.fullName} onChange={(fullName) => setProfile({ ...profile, fullName })} />
          <Field label="Email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} />
          <Button className="sm:col-span-2 w-fit" onClick={() => { updateProfile(profile); toast.success("Profile saved"); }}>
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Dealership</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={dealership.name} onChange={(name) => setDealership({ ...dealership, name })} />
          <Field label="Phone" value={dealership.phone} onChange={(phone) => setDealership({ ...dealership, phone })} />
          <Field label="Address" value={dealership.address} onChange={(address) => setDealership({ ...dealership, address })} />
          <Field label="City" value={dealership.city} onChange={(city) => setDealership({ ...dealership, city })} />
          <Field label="State" value={dealership.state} onChange={(stateValue) => setDealership({ ...dealership, state: stateValue })} />
          <Field label="ZIP" value={dealership.zip} onChange={(zip) => setDealership({ ...dealership, zip })} />
          <Field label="Currency" value={dealership.currency} onChange={(currency) => setDealership({ ...dealership, currency })} />
          <NumberInput id="tax" label="Tax rate %" value={dealership.taxRate} onChange={(taxRate) => setDealership({ ...dealership, taxRate })} />
          <Button className="sm:col-span-2 w-fit" onClick={() => { updateDealership(dealership); toast.success("Dealership saved"); }}>
            Save dealership
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Acquisition defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MoneyInput id="budget" label="Acquisition budget" value={settings.acquisitionBudget} onChange={(acquisitionBudget) => setSettings({ ...settings, acquisitionBudget })} />
          <MoneyInput id="dprofit" label="Default desired profit" value={settings.defaultDesiredProfit} onChange={(defaultDesiredProfit) => setSettings({ ...settings, defaultDesiredProfit })} />
          <NumberInput id="droi" label="Default desired ROI %" value={settings.defaultDesiredRoi} onChange={(defaultDesiredRoi) => setSettings({ ...settings, defaultDesiredRoi })} />
          <MoneyInput id="drisk" label="Default risk reserve" value={settings.defaultRiskReserve} onChange={(defaultRiskReserve) => setSettings({ ...settings, defaultRiskReserve })} />
          <MoneyInput id="dtrans" label="Default transport $/mi" value={settings.defaultTransportationRate} onChange={(defaultTransportationRate) => setSettings({ ...settings, defaultTransportationRate })} />
          <NumberInput id="comfort" label="BUY comfort margin %" value={settings.decisionThresholds.comfortMarginPercent} onChange={(comfortMarginPercent) => setSettings({ ...settings, decisionThresholds: { ...settings.decisionThresholds, comfortMarginPercent } })} />
          <NumberInput id="caution" label="Caution margin %" value={settings.decisionThresholds.cautionMarginPercent} onChange={(cautionMarginPercent) => setSettings({ ...settings, decisionThresholds: { ...settings.decisionThresholds, cautionMarginPercent } })} />
          <NumberInput id="minroi" label="Min ROI floor %" value={settings.decisionThresholds.minRoiPercent} onChange={(minRoiPercent) => setSettings({ ...settings, decisionThresholds: { ...settings.decisionThresholds, minRoiPercent } })} />
          <MoneyInput id="minp" label="Min profit floor" value={settings.decisionThresholds.minProfit} onChange={(minProfit) => setSettings({ ...settings, decisionThresholds: { ...settings.decisionThresholds, minProfit } })} />
          <NumberInput id="riskcut" label="Elevated risk if condition below" value={settings.decisionThresholds.elevatedRiskScoreBelow} onChange={(elevatedRiskScoreBelow) => setSettings({ ...settings, decisionThresholds: { ...settings.decisionThresholds, elevatedRiskScoreBelow } })} />
          <Button className="sm:col-span-2 lg:col-span-3 w-fit" onClick={() => { updateSettings(settings); toast.success("Defaults saved"); }}>
            Save defaults
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Placeholder roster for future dealership seats. Invites are not sent in this MVP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {state.team.map((member) => (
            <div key={member.id} className="flex justify-between rounded-md border px-3 py-2">
              <span>{member.fullName} · {member.email}</span>
              <span className="capitalize text-muted-foreground">{member.role} · {member.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Provider placeholders</CardTitle>
          <CardDescription>Swap mock adapters for licensed APIs without rewriting screens.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>Valuation provider: mock adapter (do not scrape KBB or similar).</p>
          <p>VIN decode provider: mock adapter.</p>
          <p>Transportation / maps provider: mock mileage formula.</p>
          <p>Vehicle history provider: mock adapter.</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "lotagent-worksheets.csv",
                exportStateCsv(
                  state.worksheets.map((sheet) => ({
                    id: sheet.id,
                    vehicle: `${sheet.vehicle.year} ${sheet.vehicle.make} ${sheet.vehicle.model}`,
                    status: sheet.status,
                    bid: sheet.costs.currentBid,
                  })),
                ),
              )
            }
          >
            Export worksheets CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Reset demo data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This restores the original 12 vehicles and purchases in this browser. It cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetDemoData();
                    toast.success("Demo data restored.");
                    window.location.reload();
                  }}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
