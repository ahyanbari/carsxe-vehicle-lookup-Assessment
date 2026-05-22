import type { VinResult, PlateResult } from "./types";

// Default: true for the entire build — only flip to false for the final demo run.
// 100 lifetime sandbox calls total; real calls verified in Step 3, mock protects the remainder.
const USE_MOCK = true;

const NOT_FOUND_CODES = new Set(["invalid_vin", "no_data", "invalid_inputs"]);

export class CarsXeError extends Error {
  constructor(
    public readonly code: "not_found" | "rate_limited" | "server_error" | "timeout"
  ) {
    super(code);
    this.name = "CarsXeError";
  }
}

export async function lookupVin(vin: string): Promise<VinResult> {
  if (USE_MOCK) return MOCK_VIN;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(
      `https://api.carsxe.com/specs?key=${process.env.CARSXE_API_KEY}&vin=${vin}`,
      { signal: controller.signal }
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new CarsXeError("timeout");
    throw new CarsXeError("server_error");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) throw new CarsXeError("rate_limited");
  if (res.status === 422) throw new CarsXeError("not_found");
  if (res.status >= 500) throw new CarsXeError("server_error");

  const json = (await res.json()) as RawVinResponse;

  // CarsXE can return success: false inside a 200 — treat it as an error
  if (!json.success) {
    if (json.error && NOT_FOUND_CODES.has(json.error)) throw new CarsXeError("not_found");
    throw new CarsXeError("server_error");
  }

  return mapVin(json);
}

export async function lookupPlate(plate: string, state: string): Promise<PlateResult> {
  if (USE_MOCK) return MOCK_PLATE;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(
      `https://api.carsxe.com/v2/platedecoder?key=${process.env.CARSXE_API_KEY}&plate=${plate}&state=${state}&country=US`,
      { signal: controller.signal }
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new CarsXeError("timeout");
    throw new CarsXeError("server_error");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) throw new CarsXeError("rate_limited");
  if (res.status === 422) throw new CarsXeError("not_found");
  if (res.status >= 500) throw new CarsXeError("server_error");

  const json = (await res.json()) as RawPlateResponse;

  // CarsXE can return success: false inside a 200 — treat it as an error
  if (!json.success) {
    if (json.error && NOT_FOUND_CODES.has(json.error)) throw new CarsXeError("not_found");
    throw new CarsXeError("server_error");
  }

  return mapPlate(json);
}

// Internal raw response shapes — not exported, only used by the mappers below
interface RawVinResponse {
  success: boolean;
  error?: string;
  input: { vin: string };
  attributes: {
    year: string; make: string; model: string; trim: string; style: string;
    type: string; made_in: string; fuel_type: string; city_mileage: string;
    highway_mileage: string; engine: string; transmission: string; drivetrain: string;
    doors: string; standard_seating: string;
    manufacturer_suggested_retail_price: string; curb_weight: string;
    exterior_color: string[];
  };
}

interface RawPlateResponse {
  success: boolean;
  error?: string;
  description: string; make: string; model: string; trim: string; year: string;
  vin: string; style: string; assembly: string; fuel_type: string; color: string;
  body_style: string; engine_size: string; drive_type: string; transmission: string;
}

function mapVin(json: RawVinResponse): VinResult {
  const a = json.attributes;
  return {
    vin: json.input.vin,
    year: a.year, make: a.make, model: a.model, trim: a.trim,
    style: a.style, type: a.type, made_in: a.made_in, fuel_type: a.fuel_type,
    city_mileage: a.city_mileage, highway_mileage: a.highway_mileage,
    engine: a.engine, transmission: a.transmission, drivetrain: a.drivetrain,
    doors: a.doors, standard_seating: a.standard_seating,
    msrp: a.manufacturer_suggested_retail_price,
    curb_weight: a.curb_weight,
    exterior_colors: a.exterior_color.slice(0, 5),
  };
}

function mapPlate(json: RawPlateResponse): PlateResult {
  return {
    description: json.description, make: json.make, model: json.model,
    trim: json.trim, year: json.year, vin: json.vin, style: json.style,
    assembly: json.assembly, fuel_type: json.fuel_type, color: json.color,
    body_style: json.body_style, engine_size: json.engine_size,
    drive_type: json.drive_type, transmission: json.transmission,
  };
}

const MOCK_VIN: VinResult = {
  vin: "WBAFR7C57CC811956",
  year: "2012",
  make: "BMW",
  model: "5-Series",
  trim: "535i",
  style: "SEDAN 4-DR",
  type: "Sedan/Saloon",
  made_in: "GERMANY",
  fuel_type: "Gasoline",
  city_mileage: "19 - 21 miles/gallon",
  highway_mileage: "29 - 31 miles/gallon",
  engine: "3.0L L6 DOHC 24V",
  transmission: "6-Speed Manual | 8-Speed Automatic",
  drivetrain: "RWD",
  doors: "4",
  standard_seating: "5",
  msrp: "$52,500 USD",
  curb_weight: "4090 lbs",
  exterior_colors: [
    "Alpine White",
    "Black Sapphire Metallic",
    "Carbon Black Metallic",
    "Cashmere Silver Metallic",
    "Deep Sea Blue Metallic",
  ],
};

const MOCK_PLATE: PlateResult = {
  description: "Kia Forte LX",
  make: "Kia",
  model: "Forte",
  trim: "LX",
  year: "2017",
  vin: "3KPFK4A78HE103497",
  style: "Sedan 4D",
  assembly: "Mexico",
  fuel_type: "Gasoline",
  color: "White",
  body_style: "Sedan",
  engine_size: "2.0L I4 MPI",
  drive_type: "FWD",
  transmission: "Automatic",
};
