import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create users
  const adminPassword = await hash("admin123", 12);
  const managerPassword = await hash("manager123", 12);
  const driverPassword = await hash("driver123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mezzi.it" },
    update: {},
    create: {
      email: "admin@mezzi.it",
      name: "Admin Sistema",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "flotta@mezzi.it" },
    update: {},
    create: {
      email: "flotta@mezzi.it",
      name: "Marco Rossi",
      passwordHash: managerPassword,
      role: "FLEET_MANAGER",
    },
  });

  const driver1 = await prisma.user.upsert({
    where: { email: "luca@mezzi.it" },
    update: {},
    create: {
      email: "luca@mezzi.it",
      name: "Luca Bianchi",
      passwordHash: driverPassword,
      role: "DRIVER",
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: "giulia@mezzi.it" },
    update: {},
    create: {
      email: "giulia@mezzi.it",
      name: "Giulia Verdi",
      passwordHash: driverPassword,
      role: "DRIVER",
    },
  });

  // Create vehicles
  const vehicle1 = await prisma.vehicle.upsert({
    where: { plate: "AA000BB" },
    update: {},
    create: {
      plate: "AA000BB",
      brand: "Fiat",
      model: "Ducato",
      year: 2022,
      vin: "ZFA25000001234567",
      fuelType: "DIESEL",
      ownershipType: "OWNED",
      status: "ACTIVE",
      assignedDriverId: driver1.id,
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { plate: "CC111DD" },
    update: {},
    create: {
      plate: "CC111DD",
      brand: "Volkswagen",
      model: "Transporter",
      year: 2023,
      fuelType: "DIESEL",
      ownershipType: "LEASED",
      status: "ACTIVE",
      assignedDriverId: driver2.id,
    },
  });

  const vehicle3 = await prisma.vehicle.upsert({
    where: { plate: "EE222FF" },
    update: {},
    create: {
      plate: "EE222FF",
      brand: "Renault",
      model: "Kangoo E-Tech",
      year: 2024,
      fuelType: "ELECTRIC",
      ownershipType: "RENTED",
      status: "ACTIVE",
      notes: "Mezzo pool - non assegnato",
    },
  });

  const vehicle4 = await prisma.vehicle.upsert({
    where: { plate: "GG333HH" },
    update: {},
    create: {
      plate: "GG333HH",
      brand: "Iveco",
      model: "Daily",
      year: 2020,
      fuelType: "DIESEL",
      ownershipType: "OWNED",
      status: "MAINTENANCE",
      notes: "In officina per riparazione motore",
    },
  });

  // Mileage readings
  const mileageData = [
    { vehicleId: vehicle1.id, recordedByUserId: driver1.id, km: 45000, date: new Date("2025-12-01"), source: "MANUAL" as const },
    { vehicleId: vehicle1.id, recordedByUserId: driver1.id, km: 46200, date: new Date("2026-01-15"), source: "REFUEL" as const },
    { vehicleId: vehicle1.id, recordedByUserId: driver1.id, km: 47500, date: new Date("2026-02-20"), source: "REFUEL" as const },
    { vehicleId: vehicle2.id, recordedByUserId: driver2.id, km: 12000, date: new Date("2025-11-01"), source: "MANUAL" as const },
    { vehicleId: vehicle2.id, recordedByUserId: driver2.id, km: 13500, date: new Date("2026-01-10"), source: "REFUEL" as const },
    { vehicleId: vehicle3.id, recordedByUserId: manager.id, km: 5000, date: new Date("2026-02-01"), source: "MANUAL" as const },
    { vehicleId: vehicle4.id, recordedByUserId: manager.id, km: 98000, date: new Date("2025-10-15"), source: "MAINTENANCE" as const },
  ];

  for (const m of mileageData) {
    await prisma.mileageReading.create({ data: m });
  }

  // Refuelings
  await prisma.refueling.createMany({
    data: [
      { vehicleId: vehicle1.id, userId: driver1.id, date: new Date("2026-01-15"), km: 46200, liters: 65, costEur: 97.50, fuelType: "DIESEL", fullTank: true, station: "ENI Via Roma" },
      { vehicleId: vehicle1.id, userId: driver1.id, date: new Date("2026-02-20"), km: 47500, liters: 55, costEur: 82.50, fuelType: "DIESEL", fullTank: true, station: "Q8 Tangenziale" },
      { vehicleId: vehicle2.id, userId: driver2.id, date: new Date("2026-01-10"), km: 13500, liters: 50, costEur: 75.00, fuelType: "DIESEL", fullTank: true },
    ],
  });

  // Maintenance interventions
  await prisma.maintenanceIntervention.createMany({
    data: [
      { vehicleId: vehicle1.id, userId: manager.id, type: "TAGLIANDO", date: new Date("2025-12-15"), km: 45500, costEur: 350, garage: "Officina Rossi", description: "Tagliando 45.000 km - cambio olio e filtri" },
      { vehicleId: vehicle4.id, userId: manager.id, type: "RIPARAZIONE", date: new Date("2026-02-28"), km: 98000, costEur: 2200, garage: "Iveco Service", description: "Riparazione turbo e sostituzione cinghia distribuzione" },
      { vehicleId: vehicle2.id, userId: manager.id, type: "CAMBIO_GOMME", date: new Date("2025-11-10"), km: 12200, costEur: 480, garage: "Gomme & Service", description: "Montaggio pneumatici invernali" },
    ],
  });

  // Deadlines (some upcoming, some overdue for demo)
  await prisma.deadline.createMany({
    data: [
      { vehicleId: vehicle1.id, type: "REVISIONE", dueDate: new Date("2026-03-15"), reminderDays: 30, description: "Revisione biennale" },
      { vehicleId: vehicle1.id, type: "ASSICURAZIONE", dueDate: new Date("2026-06-01"), reminderDays: 60, description: "Rinnovo polizza RCA" },
      { vehicleId: vehicle1.id, type: "TAGLIANDO", dueDate: new Date("2026-06-15"), reminderDays: 30, description: "Tagliando 60.000 km" },
      { vehicleId: vehicle2.id, type: "BOLLO", dueDate: new Date("2026-03-31"), reminderDays: 30, description: "Pagamento bollo auto" },
      { vehicleId: vehicle2.id, type: "ASSICURAZIONE", dueDate: new Date("2026-09-01"), reminderDays: 60, description: "Rinnovo polizza RCA" },
      { vehicleId: vehicle3.id, type: "ASSICURAZIONE", dueDate: new Date("2026-04-15"), reminderDays: 30, description: "Rinnovo assicurazione noleggio" },
      { vehicleId: vehicle4.id, type: "REVISIONE", dueDate: new Date("2026-02-28"), reminderDays: 30, description: "Revisione biennale - SCADUTA", completed: false },
      { vehicleId: vehicle4.id, type: "TAGLIANDO", dueDate: new Date("2026-01-15"), reminderDays: 30, description: "Tagliando 100.000 km - SCADUTO", completed: false },
    ],
  });

  console.log("Seed completed!");
  console.log(`  Users: ${admin.name}, ${manager.name}, ${driver1.name}, ${driver2.name}`);
  console.log(`  Vehicles: ${vehicle1.plate}, ${vehicle2.plate}, ${vehicle3.plate}, ${vehicle4.plate}`);
  console.log("  + mileage readings, refuelings, maintenance, deadlines");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
