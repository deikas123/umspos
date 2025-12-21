import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const updateRequestStatusEnum = pgEnum("update_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const prospectStatusEnum = pgEnum("prospect_status", [
  "interested",
  "not_interested",
  "prospect",
  "lead",
  "presentation",
  "quotation_sent",
  "closed",
  "lost",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "METER_SALE",
  "AGENT_ASSIGNMENT",
  "METER_RETURN",
  "FAULTY_METER",
  "SYSTEM_UPDATE",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "assignment",
  "sale",
  "return",
]);
export const meterStatusEnum = pgEnum("meter_status", [
  "active",
  "replaced",
  "faulty",
]);
export const faultyMeterStatusEnum = pgEnum("faulty_meter_status", [
  "pending",
  "repaired",
  "unrepairable",
]);

// Better Auth User Table (primary user table)
export const betterAuthUser = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    role: text("role"),
    banned: boolean("banned"),
    banReason: text("banReason"),
    banExpires: timestamp("banExpires"),
    isAnonymous: boolean("isAnonymous"),
    phoneNumber: text("phoneNumber").unique(),
    phoneNumberVerified: boolean("phoneNumberVerified"),
    twoFactorEnabled: boolean("twoFactorEnabled"),
    displayName: text("displayName"),
    appRole: text("appRole").default("user"),
    isActive: boolean("isActive").default(true),
  },
  (table) => [
    check(
      "app_role_check",
      sql`${table.appRole} = ANY(ARRAY['super_admin', 'admin', 'accountant', 'sales_person', 'user']::text[])`
    ),
  ]
);

// Better Auth Two-Factor Table (required for 2FA plugin)
export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("two_factor_secret_idx").on(table.secret),
    index("two_factor_user_id_idx").on(table.userId),
  ]
);

// Legacy User Profiles Table (kept for reference, being phased out)
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  role: text("role").default("user"), // Uses CHECK constraint in DB: admin, accountant, user
  is_active: boolean("is_active").default(true),
  push_enabled: boolean("push_enabled").default(false),
});

// Meters Table
export const meters = pgTable(
  "meters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serial_number: text("serial_number").notNull().unique(),
    type: text("type").notNull(),
    added_by: uuid("added_by").notNull(),
    added_at: timestamp("added_at").defaultNow(),
    adder_name: text("adder_name").notNull(),
    batch_id: uuid("batch_id").references(() => meterPurchaseBatches.id),
  },
  (table) => [
    index("idx_meters_type").on(table.type),
    index("idx_meters_batch_id").on(table.batch_id),
    index("idx_meters_serial_number").on(table.serial_number),
  ]
);

// Agents Table
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone_number: text("phone_number").notNull().unique(),
    location: text("location").notNull(),
    county: text("county").notNull(),
    agent_type: text("agent_type").notNull().default("cash"), // 'cash' or 'credit'
    is_active: boolean("is_active").default(true),
    is_store: boolean("is_store").default(false), // true = internal /branch, false = external agent
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_agents_is_active").on(table.is_active)]
);

// Agent Inventory Table
export const agentInventory = pgTable(
  "agent_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agent_id: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    meter_id: uuid("meter_id").notNull().unique(),
    serial_number: text("serial_number").notNull(),
    type: text("type").notNull(),
    assigned_at: timestamp("assigned_at").defaultNow(),
  },
  (table) => [
    index("idx_agent_inventory_agent_id").on(table.agent_id),
    index("idx_agent_inventory_meter_id").on(table.meter_id),
    index("idx_agent_inventory_serial_number").on(table.serial_number),
  ]
);

// Agent Transactions Table
export const agentTransactions = pgTable(
  "agent_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agent_id: uuid("agent_id").references(() => agents.id, {
      onDelete: "cascade",
    }),
    transaction_type: transactionTypeEnum("transaction_type").notNull(),
    meter_type: text("meter_type").notNull(),
    quantity: integer("quantity").default(1),
    transaction_date: timestamp("transaction_date").defaultNow(),
  },
  (table) => [
    index("idx_agent_transactions_agent_id").on(table.agent_id),
    index("idx_agent_transactions_transaction_date").on(table.transaction_date),
  ]
);

// Agent Transaction Meters Table - Junction table linking transactions to individual meters
export const agentTransactionMeters = pgTable(
  "agent_transaction_meters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transaction_id: uuid("transaction_id")
      .notNull()
      .references(() => agentTransactions.id, { onDelete: "cascade" }),
    meter_id: uuid("meter_id").notNull(),
    serial_number: text("serial_number").notNull(),
  },
  (table) => [
    index("idx_agent_transaction_meters_transaction_id").on(
      table.transaction_id
    ),
    index("idx_agent_transaction_meters_meter_id").on(table.meter_id),
  ]
);

// Sale Batches Table
export const saleBatches = pgTable(
  "sale_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id),
    user_name: text("user_name").notNull(),
    meter_type: text("meter_type").notNull(),
    batch_amount: integer("batch_amount").notNull(),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    total_price: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    destination: text("destination").notNull(),
    recipient: text("recipient").notNull(),
    customer_type: text("customer_type"),
    customer_region: text("customer_region"),
    customer_county: text("customer_county"),
    customer_contact: text("customer_contact"),
    sale_date: timestamp("sale_date").defaultNow(),
    transaction_id: uuid("transaction_id").references(
      () => salesTransactions.id
    ),
    notes: text("notes"),
    note_by: uuid("note_by").references(() => userProfiles.id, {
      onUpdate: "cascade",
      onDelete: "set null",
    }),
    // Referral tracking - can be a registered user ID or a manually entered name
    referral_user_id: text("referral_user_id"), // Links to user.id if registered
    referral_name: text("referral_name"), // Name of the referrer (used when not a registered user or as display name)
    // Pickup information - tracks who collected the meters
    picked_by_type: text("picked_by_type"), // 'customer' or 'rider'
    picked_by_name: text("picked_by_name"), // Name of the person who picked up
    picked_by_contact: text("picked_by_contact"), // Contact of the person who picked up
  },
  (table) => [
    index("idx_sale_batches_transaction_id").on(table.transaction_id),
    index("idx_sale_batches_meter_type").on(table.meter_type),
    index("idx_sale_batches_customer_type").on(table.customer_type),
    index("idx_sale_batches_sale_date").on(table.sale_date),
    index("idx_sale_batches_user_id").on(table.user_id),
  ]
);

// Sales Transactions Table
export const salesTransactions = pgTable(
  "sales_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id),
    user_name: text("user_name").notNull(),
    sale_date: timestamp("sale_date").defaultNow(),
    destination: text("destination").notNull(),
    recipient: text("recipient").notNull(),
    customer_type: text("customer_type"),
    customer_region: text("customer_region"),
    customer_county: text("customer_county"),
    customer_contact: text("customer_contact"),
    reference_number: text("reference_number").unique().notNull(),
    total_amount: numeric("total_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    index("idx_sales_transactions_reference_number").on(table.reference_number),
  ]
);

// Sold Meters Table
export const soldMeters = pgTable(
  "sold_meters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meter_id: uuid("meter_id").notNull(),
    serial_number: text("serial_number").notNull(),
    sold_by: uuid("sold_by")
      .notNull()
      .references(() => userProfiles.id),
    sold_at: timestamp("sold_at").defaultNow(),
    destination: text("destination").notNull(),
    recipient: text("recipient").notNull(),
    customer_type: text("customer_type"),
    customer_region: text("customer_region"),
    customer_county: text("customer_county"),
    customer_contact: text("customer_contact"),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    batch_id: uuid("batch_id")
      .notNull()
      .references(() => saleBatches.id, { onDelete: "cascade" }),
    status: meterStatusEnum("status").default("active"),
    replacement_serial: text("replacement_serial"),
    replacement_date: timestamp("replacement_date"),
    replacement_by: uuid("replacement_by"),
  },
  (table) => [
    index("idx_sold_meters_batch_id").on(table.batch_id),
    index("idx_sold_meters_serial_number").on(table.serial_number),
    index("idx_sold_meters_status").on(table.status),
    index("idx_sold_meters_sold_at").on(table.sold_at),
  ]
);

// Faulty Returns Table
export const faultyReturns = pgTable(
  "faulty_returns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serial_number: text("serial_number").notNull().unique(),
    type: text("type").notNull(),
    returned_by: uuid("returned_by"),
    returned_at: timestamp("returned_at").defaultNow(),
    returner_name: text("returner_name"),
    fault_description: text("fault_description"),
    status: faultyMeterStatusEnum("status").default("pending"),
    original_sale_id: uuid("original_sale_id").references(() => soldMeters.id, {
      onDelete: "cascade",
    }),
    is_binned: boolean("is_binned").default(false),
    binned_at: timestamp("binned_at"),
    binned_by: text("binned_by"),
    binned_by_name: text("binned_by_name"),
  },
  (table) => [
    index("idx_faulty_returns_status").on(table.status),
    index("idx_faulty_returns_serial_number").on(table.serial_number),
  ]
);

// Notifications Table
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: notificationTypeEnum("type").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    created_by: uuid("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    is_read: boolean("is_read").default(false),
    read_by: uuid("read_by").array(),
  },
  (table) => [
    index("idx_notifications_created_at").on(table.created_at),
    index("idx_notifications_type").on(table.type),
    index("idx_notifications_is_read").on(table.is_read),
  ]
);

// Meter Purchase Batches Table
export const meterPurchaseBatches = pgTable("meter_purchase_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  meter_type: text("meter_type").notNull(),
  quantity: integer("quantity").notNull(),
  total_cost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  purchase_date: timestamp("purchase_date").defaultNow(),
  added_by: uuid("added_by"),
  created_at: timestamp("created_at").defaultNow(),
  batch_number: text("batch_number").unique().notNull(),
});

// Sale Batch Update Requests Table - for approval workflow
export const saleBatchUpdateRequests = pgTable(
  "sale_batch_update_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sale_batch_id: uuid("sale_batch_id")
      .notNull()
      .references(() => saleBatches.id, { onDelete: "cascade" }),
    requested_by: text("requested_by").notNull(),
    requested_by_name: text("requested_by_name").notNull(),
    requested_at: timestamp("requested_at").defaultNow(),
    status: updateRequestStatusEnum("status").default("pending"),
    approved_by: text("approved_by"),
    approved_by_name: text("approved_by_name"),
    approved_at: timestamp("approved_at"),
    rejection_reason: text("rejection_reason"),
    update_reason: text("update_reason").notNull(),
    // Store the changes as JSON: { field: { old: value, new: value } }
    changes: jsonb("changes").notNull(),
    // Specific fields that can be updated
    new_sale_date: timestamp("new_sale_date"),
    new_unit_price: numeric("new_unit_price", { precision: 10, scale: 2 }),
    new_total_price: numeric("new_total_price", { precision: 10, scale: 2 }),
  },
  (table) => [
    index("idx_sale_batch_update_requests_status").on(table.status),
    index("idx_sale_batch_update_requests_sale_batch_id").on(
      table.sale_batch_id
    ),
  ]
);

// Sale Batch Audit Log Table - permanent record of all changes
export const saleBatchAuditLog = pgTable("sale_batch_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  sale_batch_id: uuid("sale_batch_id")
    .notNull()
    .references(() => saleBatches.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // 'created', 'update_requested', 'update_approved', 'update_rejected', 'updated'
  performed_by: text("performed_by").notNull(),
  performed_by_name: text("performed_by_name").notNull(),
  performed_at: timestamp("performed_at").defaultNow(),
  old_values: jsonb("old_values"),
  new_values: jsonb("new_values"),
  update_request_id: uuid("update_request_id").references(
    () => saleBatchUpdateRequests.id
  ),
  note: text("note"),
});

// Client Prospects Table - for sales person field visits
export const clientProspects = pgTable(
  "client_prospects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Sales person who created this prospect
    sales_person_id: text("sales_person_id")
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
    sales_person_name: text("sales_person_name").notNull(),
    // Client information
    client_name: text("client_name").notNull(),
    location: text("location").notNull(),
    contact: text("contact").notNull(),
    // Prospect status from dropdown
    status: prospectStatusEnum("status").notNull().default("prospect"),
    // Open text field for additional remarks
    other_remarks: text("other_remarks"),
    // Meter information
    meter_type: text("meter_type").notNull(),
    number_of_meters: integer("number_of_meters").notNull().default(1),
    // Geolocation (auto-captured)
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    // Place name from reverse geocoding
    place_name: text("place_name"),
    // Timestamps
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
    // Change history - tracks all modifications with timestamps and changed fields
    // Format: [{ timestamp: Date, changed_by: string, changed_by_name: string, changes: { field: { old: value, new: value } } }]
    change_history: jsonb("change_history").default([]),
  },
  (table) => [
    index("idx_client_prospects_sales_person_id").on(table.sales_person_id),
    index("idx_client_prospects_status").on(table.status),
    index("idx_client_prospects_created_at").on(table.created_at),
  ]
);

// Export types for use in the application
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Meter = typeof meters.$inferSelect;
export type NewMeter = typeof meters.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentInventoryItem = typeof agentInventory.$inferSelect;
export type NewAgentInventoryItem = typeof agentInventory.$inferInsert;
export type AgentTransaction = typeof agentTransactions.$inferSelect;
export type NewAgentTransaction = typeof agentTransactions.$inferInsert;
export type SaleBatch = typeof saleBatches.$inferSelect;
export type NewSaleBatch = typeof saleBatches.$inferInsert;
export type SalesTransaction = typeof salesTransactions.$inferSelect;
export type NewSalesTransaction = typeof salesTransactions.$inferInsert;
export type SoldMeter = typeof soldMeters.$inferSelect;
export type NewSoldMeter = typeof soldMeters.$inferInsert;
export type FaultyReturn = typeof faultyReturns.$inferSelect;
export type NewFaultyReturn = typeof faultyReturns.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type MeterPurchaseBatch = typeof meterPurchaseBatches.$inferSelect;
export type NewMeterPurchaseBatch = typeof meterPurchaseBatches.$inferInsert;
export type SaleBatchUpdateRequest =
  typeof saleBatchUpdateRequests.$inferSelect;
export type NewSaleBatchUpdateRequest =
  typeof saleBatchUpdateRequests.$inferInsert;
export type SaleBatchAuditLog = typeof saleBatchAuditLog.$inferSelect;
export type NewSaleBatchAuditLog = typeof saleBatchAuditLog.$inferInsert;
export type ClientProspect = typeof clientProspects.$inferSelect;
export type NewClientProspect = typeof clientProspects.$inferInsert;
