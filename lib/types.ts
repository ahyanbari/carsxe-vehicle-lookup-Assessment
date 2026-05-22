export interface VinResult {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  style: string;
  type: string;
  made_in: string;
  fuel_type: string;
  city_mileage: string;
  highway_mileage: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  doors: string;
  standard_seating: string;
  msrp: string;
  curb_weight: string;
  exterior_colors: string[];
}

export interface PlateResult {
  description: string;
  make: string;
  model: string;
  trim: string;
  year: string;
  vin: string;
  style: string;
  assembly: string;
  fuel_type: string;
  color: string;
  body_style: string;
  engine_size: string;
  drive_type: string;
  transmission: string;
}
