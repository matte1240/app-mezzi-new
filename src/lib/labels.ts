export const ownershipLabels: Record<string, string> = {
  OWNED: "Proprietà",
  RENTED: "Noleggio",
  LEASED: "Leasing",
};

export const statusLabels: Record<string, string> = {
  ACTIVE: "Attivo",
  INACTIVE: "Inattivo",
  MAINTENANCE: "In manutenzione",
};

export const fuelLabels: Record<string, string> = {
  DIESEL: "Diesel",
  GASOLINE: "Benzina",
  ELECTRIC: "Elettrico",
  HYBRID: "Ibrido",
  LPG: "GPL",
  CNG: "Metano",
};

export const maintenanceTypeLabels: Record<string, string> = {
  TAGLIANDO: "Tagliando",
  REVISIONE: "Revisione",
  RIPARAZIONE: "Riparazione",
  CAMBIO_GOMME: "Cambio gomme",
  ALTRO: "Altro",
};

export const deadlineTypeLabels: Record<string, string> = {
  TAGLIANDO: "Tagliando",
  REVISIONE: "Revisione",
  ASSICURAZIONE: "Assicurazione",
  BOLLO: "Bollo",
  REVISIONE_TACHIGRAFO: "Rev. Tachigrafo",
  ALTRO: "Altro",
};

export const documentTypeLabels: Record<string, string> = {
  CONTRATTO_NOLEGGIO: "Contratto noleggio",
  ASSICURAZIONE: "Assicurazione",
  LIBRETTO: "Libretto",
  CARTA_CIRCOLAZIONE: "Carta di circolazione",
  ALTRO: "Altro",
};

export const roleLabels: Record<string, string> = {
  ADMIN: "Amministratore",
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Autista",
};

export const plannedMaintenanceStatusLabels: Record<string, string> = {
  PLANNED: "Pianificato",
  COMPLETED: "Completato",
  CANCELLED: "Annullato",
};

export const plannedMaintenanceStatusColors: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
};

export const tripStatusLabels: Record<string, string> = {
  OPEN: "In corso",
  COMPLETED: "Completato",
  ABANDONED: "Interrotto",
};

export const tripAnomalyTypeLabels: Record<string, string> = {
  LONG_DURATION: "Durata eccessiva",
  EXCESSIVE_DISTANCE: "Distanza eccessiva",
  HIGH_AVERAGE_SPEED: "Velocita media anomala",
  KM_INVARIATO: "Km invariato",
  MANUAL: "Segnalazione manuale",
};

export const tripAnomalyStatusLabels: Record<string, string> = {
  OPEN: "Aperta",
  IN_REVIEW: "In lavorazione",
  RESOLVED: "Risolta",
};

export const tripAnomalyStatusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
};
