import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateVin, validatePlate } from "@/lib/validation";
import { lookupVin, lookupPlate, CarsXeError } from "@/lib/carsxe";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find a vehicle for that VIN/plate.",
  rate_limited: "Too many requests. Please wait a moment.",
  server_error: "CarsXE is having trouble. Try again in a moment.",
  timeout: "Request timed out. Check your connection.",
};

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  rate_limited: 429,
  server_error: 502,
  timeout: 504,
};

function carsxeErrorResponse(err: CarsXeError) {
  return NextResponse.json(
    { error: ERROR_MESSAGES[err.code] },
    { status: ERROR_STATUS[err.code] }
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: ERROR_MESSAGES.rate_limited }, { status: 429 });
  }

  let body: { type?: unknown; value?: unknown; state?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, value, state } = body;

  if (typeof value !== "string" || !value) {
    return NextResponse.json({ error: "Missing value." }, { status: 400 });
  }

  if (type === "vin") {
    const validationError = validateVin(value);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    try {
      const data = await lookupVin(value.trim().toUpperCase());
      return NextResponse.json({ type: "vin", data });
    } catch (err) {
      if (err instanceof CarsXeError) return carsxeErrorResponse(err);
      return NextResponse.json({ error: ERROR_MESSAGES.server_error }, { status: 500 });
    }
  }

  if (type === "plate") {
    const validationError = validatePlate(value);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    if (typeof state !== "string" || state.length !== 2) {
      return NextResponse.json(
        { error: "A 2-letter US state code is required." },
        { status: 400 }
      );
    }
    try {
      const data = await lookupPlate(value.trim().toUpperCase(), state.toUpperCase());
      return NextResponse.json({ type: "plate", data });
    } catch (err) {
      if (err instanceof CarsXeError) return carsxeErrorResponse(err);
      return NextResponse.json({ error: ERROR_MESSAGES.server_error }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "type must be 'vin' or 'plate'." }, { status: 400 });
}
