import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password obbligatoria"),
});

export const vehicleSchema = z.object({
  plate: z
    .string()
    .min(1, "Targa obbligatoria")
    .max(10, "Targa troppo lunga")
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  brand: z.string().min(1, "Marca obbligatoria"),
  model: z.string().min(1, "Modello obbligatorio"),
  year: z.coerce
    .number()
    .int()
    .min(1990, "Anno non valido")
    .max(new Date().getFullYear() + 1, "Anno non valido"),
  vin: z.string().optional().nullable(),
  fuelType: z.enum(["DIESEL", "GASOLINE", "ELECTRIC", "HYBRID", "LPG", "CNG"]),
  ownershipType: z.enum(["OWNED", "RENTED", "LEASED"]),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("ACTIVE"),
  registrationDate: z.coerce.date().optional().nullable(),
  maintenanceIntervalMonths: z.coerce.number().int().min(1).max(120).optional().nullable(),
  maintenanceIntervalKm: z.coerce.number().int().min(1000).max(200000).optional().nullable(),
  assignedDriverId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const mileageSchema = z.object({
  vehicleId: z.string().min(1),
  km: z.coerce.number().int().positive("Km deve essere positivo"),
  date: z.coerce.date(),
  source: z.enum(["MANUAL", "REFUEL", "MAINTENANCE", "TRIP"]).default("MANUAL"),
  notes: z.string().optional().nullable(),
});

export const refuelingSchema = z.object({
  vehicleId: z.string().min(1),
  date: z.coerce.date(),
  km: z.coerce.number().int().positive("Km deve essere positivo"),
  liters: z.coerce.number().positive("Litri deve essere positivo"),
  costEur: z.coerce.number().nonnegative("Costo non può essere negativo"),
  fuelType: z.enum(["DIESEL", "GASOLINE", "ELECTRIC", "HYBRID", "LPG", "CNG"]),
  fullTank: z.coerce.boolean().default(true),
  station: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum([
    "TAGLIANDO",
    "REVISIONE",
    "RIPARAZIONE",
    "CAMBIO_GOMME",
    "ALTRO",
  ]),
  date: z.coerce.date(),
  km: z.coerce.number().int().positive("Km deve essere positivo"),
  costEur: z.coerce.number().nonnegative().optional().nullable(),
  garage: z.string().optional().nullable(),
  description: z.string().min(1, "Descrizione obbligatoria"),
  notes: z.string().optional().nullable(),
});

export const deadlineSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum([
    "TAGLIANDO",
    "REVISIONE",
    "ASSICURAZIONE",
    "BOLLO",
    "REVISIONE_TACHIGRAFO",
    "ALTRO",
  ]),
  dueDate: z.coerce.date(),
  reminderDays: z.coerce.number().int().min(1).max(365).default(30),
  description: z.string().optional().nullable(),
});

export const userSchema = z.object({
  email: z.string().email("Email non valida"),
  name: z.string().min(1, "Nome obbligatorio"),
  password: z.string().min(6, "Password minimo 6 caratteri").optional(),
  role: z.enum(["ADMIN", "FLEET_MANAGER", "DRIVER"]),
  active: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type MileageInput = z.infer<typeof mileageSchema>;
export type RefuelingInput = z.infer<typeof refuelingSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type DeadlineInput = z.infer<typeof deadlineSchema>;
export type UserInput = z.infer<typeof userSchema>;

export const plannedMaintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  sourceDeadlineId: z.string().optional().nullable(),
  sourceTripAnomalyId: z.string().optional().nullable(),
  type: z.enum([
    "TAGLIANDO",
    "REVISIONE",
    "RIPARAZIONE",
    "CAMBIO_GOMME",
    "ALTRO",
  ]),
  scheduledDate: z.coerce.date(),
  description: z.string().min(1, "Descrizione obbligatoria"),
  garage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type PlannedMaintenanceInput = z.infer<typeof plannedMaintenanceSchema>;

export const tripStartSchema = z.object({
  vehicleId: z.string().min(1, "Mezzo obbligatorio"),
  startKm: z.coerce.number().int().positive("Km iniziale non valido"),
  startQrRaw: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const tripStopSchema = z.object({
  tripId: z.string().min(1),
  endKm: z.coerce.number().int().positive("Km finale non valido"),
  endQrRaw: z.string().optional().nullable(),
  manualAnomalyType: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .enum(["MANUAL", "LONG_DURATION", "EXCESSIVE_DISTANCE", "HIGH_AVERAGE_SPEED", "KM_INVARIATO"])
      .optional()
      .nullable()
  ),
  manualAnomalyMessage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const tripAnomalyStatusUpdateSchema = z.object({
  anomalyId: z.string().min(1, "Segnalazione non valida"),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED"]),
  resolutionNotes: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().max(1000, "Note troppo lunghe").optional().nullable()
  ),
});

export type TripStartInput = z.infer<typeof tripStartSchema>;
export type TripStopInput = z.infer<typeof tripStopSchema>;
export type TripAnomalyStatusUpdateInput = z.infer<typeof tripAnomalyStatusUpdateSchema>;
