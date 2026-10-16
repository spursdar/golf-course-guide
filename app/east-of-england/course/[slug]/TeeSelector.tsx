"use client";

import { useRouter } from "next/navigation";

type Tee = {
  id: string;
  name: string;
};

type TeeSelectorProps = {
  tees: Tee[];
  selectedTeeId: string;
};

function getTeeColour(name: string) {
  const value = name.toLowerCase();

  if (value.includes("light blue")) return "#7dd3fc";
  if (value.includes("blue")) return "#2563eb";
  if (value.includes("white")) return "#ffffff";
  if (value.includes("yellow")) return "#facc15";
  if (value.includes("red")) return "#dc2626";
  if (value.includes("black")) return "#111827";
  if (value.includes("green")) return "#16a34a";
  if (value.includes("orange")) return "#f97316";
  if (value.includes("purple")) return "#7e22ce";
  if (value.includes("teal")) return "#0f766e";
  if (value.includes("silver")) return "#cbd5e1";
  if (value.includes("stone")) return "#a8a29e";
  if (value.includes("amethyst")) return "#8b5cf6";
  if (value.includes("cerise")) return "#e11d48";

  return "#d1d5db";
}

export default function TeeSelector({
  tees,
  selectedTeeId,
}: TeeSelectorProps) {
  const router = useRouter();
  const selectedTee = tees.find((tee) => tee.id === selectedTeeId);
  const selectedColour = getTeeColour(selectedTee?.name ?? "");

  return (
    <div className="mt-6">
      <label className="mb-2 block font-semibold text-[#173b2c]">
        Choose tee
      </label>

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-5 w-5 shrink-0 rounded-full border border-gray-300 shadow-sm"
          style={{ backgroundColor: selectedColour }}
        />

        <select
          value={selectedTeeId}
          onChange={(event) =>
            router.replace(`?tee=${event.target.value}`, { scroll: false })
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          style={{
            borderLeftWidth: "8px",
            borderLeftColor: selectedColour,
          }}
        >
          {tees.map((tee) => (
            <option key={tee.id} value={tee.id}>
              {tee.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
