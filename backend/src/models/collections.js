export const COLLECTIONS = Object.freeze({
  users: "users",
  notifications: "notifications",
  services: "services",
  rooms: "rooms",
  reviews: "reviews",
  consultations: "consultations",
  appointments: "appointments",
  invoices: "invoices",
  treatmentRecords: "treatmentRecords",
  treatmentPlans: "treatmentPlans",
  clinicSettings: "clinicSettings"
});

export const COLLECTION_INDEXES = Object.freeze({
  [COLLECTIONS.users]: [
    { key: { phone: 1 }, options: { unique: true } },
    { key: { role: 1, status: 1 } }
  ],
  [COLLECTIONS.notifications]: [
    { key: { user: 1, isRead: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.services]: [
    { key: { isActive: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.rooms]: [
    { key: { isActive: 1, name: 1 } }
  ],
  [COLLECTIONS.reviews]: [
    { key: { patient: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.consultations]: [
    { key: { phone: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.appointments]: [
    { key: { patient: 1, createdAt: -1 } },
    { key: { startAt: 1, status: 1 } }
  ],
  [COLLECTIONS.invoices]: [
    { key: { patient: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.treatmentRecords]: [
    { key: { patient: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.treatmentPlans]: [
    { key: { patient: 1, createdAt: -1 } }
  ],
  [COLLECTIONS.clinicSettings]: [
    { key: { key: 1 }, options: { unique: true } }
  ]
});
