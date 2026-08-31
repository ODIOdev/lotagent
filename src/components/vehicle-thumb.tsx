import { vehicleTitle } from "@/lib/format";
import type { VehicleInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VehicleThumb({
  vehicle,
  className,
}: {
  vehicle: Pick<VehicleInfo, "year" | "make" | "model" | "trim" | "imageUrl">;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[16/10] items-end overflow-hidden rounded-lg bg-linear-to-br from-[#0b1f3a] to-[#1565ff] p-3 text-white",
        className,
      )}
    >
      {vehicle.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vehicle.imageUrl} alt={vehicleTitle(vehicle)} className="absolute inset-0 size-full object-cover" />
      ) : null}
      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
          {vehicle.year} {vehicle.make}
        </p>
        <p className="text-sm font-semibold leading-tight">
          {vehicle.model} {vehicle.trim}
        </p>
      </div>
    </div>
  );
}
