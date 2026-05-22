// VIN: 17 alphanumeric, no I/O/Q per ISO 3779
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const PLATE_RE = /^[A-Z0-9]{1,8}$/;

export function validateVin(value: string): string | null {
  return VIN_RE.test(value.trim().toUpperCase())
    ? null
    : "VIN must be 17 characters and cannot contain I, O, or Q.";
}

export function validatePlate(value: string): string | null {
  return PLATE_RE.test(value.trim().toUpperCase())
    ? null
    : "Plate must be 1–8 alphanumeric characters.";
}
