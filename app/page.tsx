"use client";

import { useState } from "react";
import type { VinResult, PlateResult } from "@/lib/types";

// Mirrors lib/validation.ts — client-side detection for UX only; server re-validates on submit
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const PLATE_RE = /^[A-Z0-9]{1,8}$/;

type LookupResult = { type: "vin"; data: VinResult } | { type: "plate"; data: PlateResult };

function detectType(raw: string): "vin" | "plate" | null {
  const v = raw.trim().toUpperCase();
  if (VIN_RE.test(v)) return "vin";
  if (PLATE_RE.test(v)) return "plate";
  return null;
}

// Only fires at exactly 17 chars — the one length where the user is clearly attempting a VIN
function getInputError(raw: string): string | null {
  const v = raw.trim().toUpperCase();
  if (v.length === 17 && !VIN_RE.test(v)) {
    return "VIN must be 17 characters and cannot contain I, O, or Q.";
  }
  return null;
}

// Empty field fallback
const f = (v: string) => v || "—";

const US_STATES: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["DC","District of Columbia"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],
  ["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],
  ["WI","Wisconsin"],["WY","Wyoming"],
];

function VinCard({ data }: { data: VinResult }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
      <div>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">Vehicle</p>
        <h2 className="text-zinc-100 text-xl font-mono font-semibold">
          {data.year} {data.make} {data.model}
        </h2>
        <p className="text-zinc-400 text-sm font-mono mt-0.5">{f(data.trim)} · {f(data.style)}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {([
          ["Type",         data.type],
          ["Made In",      data.made_in],
          ["Fuel",         data.fuel_type],
          ["Engine",       data.engine],
          ["Transmission", data.transmission],
          ["Drivetrain",   data.drivetrain],
          ["Doors",        data.doors],
          ["Seating",      data.standard_seating],
          ["MSRP",         data.msrp],
          ["Curb Weight",  data.curb_weight],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label}>
            <p className="text-zinc-500 text-xs font-mono">{label}</p>
            <p className="text-zinc-200 text-sm font-mono mt-0.5">{f(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <p className="text-zinc-500 text-xs font-mono">City MPG</p>
          <p className="text-zinc-200 text-sm font-mono mt-0.5">{f(data.city_mileage)}</p>
        </div>
        <div>
          <p className="text-zinc-500 text-xs font-mono">Highway MPG</p>
          <p className="text-zinc-200 text-sm font-mono mt-0.5">{f(data.highway_mileage)}</p>
        </div>
      </div>

      {data.exterior_colors.length > 0 && (
        <div>
          <p className="text-zinc-500 text-xs font-mono mb-2">Exterior Colors</p>
          <div className="flex flex-wrap gap-1.5">
            {data.exterior_colors.map((color) => (
              <span key={color} className="text-xs font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-zinc-800">
        <p className="text-zinc-500 text-xs font-mono">VIN</p>
        <p className="text-zinc-400 text-xs font-mono tracking-widest mt-0.5">{data.vin}</p>
      </div>
    </div>
  );
}

function PlateCard({ data }: { data: PlateResult }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
      <div>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">Vehicle</p>
        <h2 className="text-zinc-100 text-xl font-mono font-semibold">
          {data.year} {data.make} {data.model}
        </h2>
        <p className="text-zinc-400 text-sm font-mono mt-0.5">{f(data.trim)} · {f(data.description)}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {([
          ["Style",        data.style],
          ["Body",         data.body_style],
          ["Assembly",     data.assembly],
          ["Fuel",         data.fuel_type],
          ["Color",        data.color],
          ["Engine",       data.engine_size],
          ["Drive",        data.drive_type],
          ["Transmission", data.transmission],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label}>
            <p className="text-zinc-500 text-xs font-mono">{label}</p>
            <p className="text-zinc-200 text-sm font-mono mt-0.5">{f(value)}</p>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-zinc-800">
        <p className="text-zinc-500 text-xs font-mono">VIN</p>
        <p className="text-zinc-400 text-xs font-mono tracking-widest mt-0.5">{f(data.vin)}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5 animate-pulse">
      <div>
        <div className="h-3 w-14 bg-zinc-800 rounded mb-2" />
        <div className="h-6 w-52 bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-36 bg-zinc-800 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-12 bg-zinc-800 rounded mb-1.5" />
            <div className="h-4 w-24 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-zinc-800">
        <div className="h-3 w-8 bg-zinc-800 rounded mb-1.5" />
        <div className="h-3 w-40 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-red-950/40 border border-red-900/60 rounded-lg px-4 py-3">
      <p className="text-red-400 font-mono text-sm">{message}</p>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detected = input.trim() ? detectType(input) : null;
  const inputError = getInputError(input);
  const canSubmit = !inputError && (detected === "vin" || (detected === "plate" && !!state));

  async function submit() {
    if (!canSubmit || status === "loading") return;
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: detected,
          value: input.trim().toUpperCase(),
          ...(detected === "plate" && { state }),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setResult(json as LookupResult);
        setStatus("done");
      }
    } catch {
      setError("Request timed out. Check your connection.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-3">
        <div className="mb-6">
          <h1 className="text-zinc-100 text-2xl font-mono font-semibold tracking-tight">
            Vehicle Lookup
          </h1>
          <p className="text-zinc-500 text-sm font-mono mt-1">
            Enter a VIN or license plate number
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              setState("");
              setResult(null);
              setError(null);
              setStatus("idle");
            }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="e.g. WBAFR7C57CC811956 or 7XER187"
            maxLength={17}
            className={`w-full bg-zinc-900 border rounded-md px-4 py-3 pr-20 text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none transition-colors ${
              inputError
                ? "border-red-500 focus:border-red-400"
                : "border-zinc-700 focus:border-cyan-500"
            }`}
          />
          {detected && !inputError && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
              {detected === "vin" ? "VIN" : "PLATE"}
            </span>
          )}
        </div>

        {inputError && (
          <p className="text-red-400 font-mono text-xs pt-0.5">{inputError}</p>
        )}

        {detected === "plate" && (
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-zinc-100 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">Select state…</option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit || status === "loading"}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-mono font-semibold text-sm py-3 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Looking up…" : "Look Up"}
        </button>

        {status === "loading" && <Skeleton />}
        {status === "error" && error && <ErrorCard message={error} />}
        {status === "done" && result && (
          result.type === "vin"
            ? <VinCard data={result.data} />
            : <PlateCard data={result.data} />
        )}
      </div>
    </main>
  );
}
