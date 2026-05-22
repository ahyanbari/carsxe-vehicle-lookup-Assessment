"use client";

import { useState } from "react";

// Mirrors lib/validation.ts — client-side detection for UX only; server re-validates on submit
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const PLATE_RE = /^[A-Z0-9]{1,8}$/;

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

export default function Home() {
  const [input, setInput] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<unknown>(null);
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
        setResult(json);
        setStatus("done");
      }
    } catch {
      setError("Request timed out. Check your connection.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
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

        {/* Step 5 replaces this with a loading skeleton, styled error, and result card */}
        {status === "error" && error && (
          <p className="text-red-400 font-mono text-sm pt-1">{error}</p>
        )}
        {status === "done" && result && (
          <pre className="text-zinc-300 font-mono text-xs bg-zinc-900 border border-zinc-800 p-4 rounded-md overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
