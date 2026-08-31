"use client";

import { useParams } from "next/navigation";
import { AcquisitionForm } from "@/components/acquisition/acquisition-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/data/use-app-state";
import Link from "next/link";

export default function EditAcquisitionPage() {
  const params = useParams<{ id: string }>();
  const state = useAppState();
  const sheet = state.worksheets.find((item) => item.id === params.id);

  if (!sheet) {
    return (
      <EmptyState
        title="Worksheet not found"
        description="It may have been deleted or this is a stale link."
        action={
          <Button asChild>
            <Link href="/acquisitions/new">New acquisition</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Acquisition worksheet</h1>
        <p className="text-sm text-muted-foreground">
          {sheet.vehicle.year} {sheet.vehicle.make} {sheet.vehicle.model} · {sheet.vehicle.stockNumber}
        </p>
      </div>
      <AcquisitionForm initial={sheet} />
    </div>
  );
}
