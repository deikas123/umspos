import { pgTable, index, foreignKey, uuid, text, unique, pgPolicy, check, boolean, timestamp, integer, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const prospectStatus = pgEnum("prospect_status", ['interested', 'not_interested', 'prospect', 'lead', 'presentation', 'quotation_sent', 'closed', 'lost'])
export const updateRequestStatus = pgEnum("update_request_status", ['pending', 'approved', 'rejected'])


export const agentTransactionMeters = pgTable("agent_transaction_meters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	transactionId: uuid("transaction_id").notNull(),
	meterId: uuid("meter_id").notNull(),
	serialNumber: text("serial_number").notNull(),
}, (table) => [
	index("idx_agent_transaction_meters_meter_id").using("btree", table.meterId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_transaction_meters_transaction_id").using("btree", table.transactionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [agentTransactions.id],
			name: "agent_transaction_meters_transaction_id_agent_transactions_id_f"
		}).onDelete("cascade"),
]);

export const twoFactor = pgTable("two_factor", {
	id: text().primaryKey().notNull(),
	secret: text().notNull(),
	backupCodes: text("backup_codes").notNull(),
	userId: text("user_id").notNull(),
}, (table) => [
	index("two_factor_secret_idx").using("btree", table.secret.asc().nullsLast().op("text_ops")),
	index("two_factor_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const agents = pgTable("agents", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
	phoneNumber: text("phone_number").notNull(),
	location: text().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	county: text(),
	agentType: text("agent_type").default('cash').notNull(),
	isStore: boolean("is_store").default(false),
}, (table) => [
	index("idx_agents_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("agents_phone_number_key").on(table.phoneNumber),
	pgPolicy("Everyone can view agents", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("Only admins can create agents", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Only admins can delete agents", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Only admins can update agents", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("agents_agent_type_check", sql`agent_type = ANY (ARRAY['cash'::text, 'credit'::text])`),
	check("valid_phone", sql`phone_number ~ '^\+?[0-9]{10,15}$'::text`),
]);

export const agentInventory = pgTable("agent_inventory", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	agentId: uuid("agent_id").notNull(),
	meterId: uuid("meter_id").notNull(),
	serialNumber: text("serial_number").notNull(),
	type: text().notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_agent_inventory_agent_id").using("btree", table.agentId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_inventory_meter_id").using("btree", table.meterId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_inventory_serial_number").using("btree", table.serialNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_inventory_agent_id_fkey"
		}),
	pgPolicy("Everyone can view agent inventory", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("Only admins can add to inventory", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Only admins can remove from inventory", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Only admins can update inventory", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const agentTransactions = pgTable("agent_transactions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	agentId: uuid("agent_id"),
	transactionType: text("transaction_type").notNull(),
	meterType: text("meter_type").notNull(),
	quantity: integer().notNull(),
	transactionDate: timestamp("transaction_date", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_agent_transactions_agent_id").using("btree", table.agentId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_transactions_transaction_date").using("btree", table.transactionDate.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_transactions_agent_id_fkey"
		}),
	pgPolicy("Only admins can add transactions", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((auth.uid() IS NOT NULL) AND (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text))`  }),
	pgPolicy("Only admins can delete transactions", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Only admins can update transactions", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Only admins can view transactions", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("agent_transactions_transaction_type_check", sql`transaction_type = ANY (ARRAY['assignment'::text, 'sale'::text, 'return'::text])`),
	check("positive_quantity", sql`quantity > 0`),
]);

export const meterPurchaseBatches = pgTable("meter_purchase_batches", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	batchNumber: text("batch_number"),
	meterType: text("meter_type").notNull(),
	quantity: integer().notNull(),
	totalCost: numeric("total_cost").notNull(),
	unitCost: numeric("unit_cost").generatedAlwaysAs(sql`(total_cost / (quantity)::numeric)`),
	purchaseDate: timestamp("purchase_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	addedBy: text("added_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("meter_purchase_batches_batch_number_key").on(table.batchNumber),
	pgPolicy("Enable delete for admins only", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((auth.uid() IS NOT NULL) AND (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text))` }),
	pgPolicy("Enable insert for admins only", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Enable read access for admins", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Enable update for admins only", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const meters = pgTable("meters", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	serialNumber: text("serial_number").notNull(),
	type: text().notNull(),
	addedBy: text("added_by").notNull(),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	adderName: text("adder_name").notNull(),
	batchId: uuid("batch_id"),
}, (table) => [
	index("idx_meters_batch_id").using("btree", table.batchId.asc().nullsLast().op("uuid_ops")),
	index("idx_meters_serial_number").using("btree", table.serialNumber.asc().nullsLast().op("text_ops")),
	index("idx_meters_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [meterPurchaseBatches.id],
			name: "meters_batch_id_fkey"
		}),
	unique("meters_serial_number_key").on(table.serialNumber),
	pgPolicy("Meters can be read by everyone", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("Only admins can add meters", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can delete meters during sale", { as: "permissive", for: "delete", to: ["authenticated"] }),
	check("meters_type_check", sql`type = ANY (ARRAY['integrated'::text, 'split'::text, 'water'::text, 'gas'::text, '3 phase'::text, 'smart'::text])`),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().primaryKey().notNull(),
	role: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	name: text(),
	pushEnabled: boolean("push_enabled").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "user_profiles_id_fkey"
		}),
	pgPolicy("Only admins can create profiles", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((auth.uid() IS NOT NULL) AND (( SELECT user_profiles_1.role
   FROM user_profiles user_profiles_1
  WHERE (user_profiles_1.id = auth.uid())) = 'admin'::text))`  }),
	pgPolicy("Only admins can delete profiles", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Only admins can update profiles", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Users can view all profiles", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("user_profiles_role_check", sql`role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'accountant'::text, 'user'::text])`),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
	impersonatedBy: text(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	role: text(),
	banned: boolean(),
	banReason: text(),
	banExpires: timestamp({ withTimezone: true, mode: 'string' }),
	isAnonymous: boolean(),
	phoneNumber: text(),
	phoneNumberVerified: boolean(),
	twoFactorEnabled: boolean(),
	userMetadata: jsonb(),
	appMetadata: jsonb(),
	invitedAt: timestamp({ withTimezone: true, mode: 'string' }),
	lastSignInAt: timestamp({ withTimezone: true, mode: 'string' }),
	displayName: text(),
	appRole: text().default('user'),
	isActive: boolean().default(true),
}, (table) => [
	unique("user_email_key").on(table.email),
	unique("user_phoneNumber_key").on(table.phoneNumber),
	check("app_role_check", sql`"appRole" = ANY (ARRAY['super_admin'::text, 'admin'::text, 'accountant'::text, 'sales_person'::text, 'user'::text])`),
]);

export const twoFactor = pgTable("twoFactor", {
	id: text().primaryKey().notNull(),
	secret: text().notNull(),
	backupCodes: text().notNull(),
	userId: text().notNull(),
}, (table) => [
	index("twoFactor_secret_idx").using("btree", table.secret.asc().nullsLast().op("text_ops")),
	index("twoFactor_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "twoFactor_userId_fkey"
		}).onDelete("cascade"),
]);

export const saleBatches = pgTable("sale_batches", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: text("user_id").notNull(),
	userName: text("user_name").notNull(),
	meterType: text("meter_type").notNull(),
	batchAmount: integer("batch_amount").notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	saleDate: timestamp("sale_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	destination: text().notNull(),
	recipient: text().notNull(),
	customerType: text("customer_type"),
	customerCounty: text("customer_county"),
	customerContact: text("customer_contact"),
	transactionId: uuid("transaction_id"),
	notes: text(),
	noteBy: text("note_by"),
	approved: boolean(),
	approvedBy: uuid("approved_by"),
	customerRegion: text("customer_region"),
	referralUserId: text("referral_user_id"),
	referralName: text("referral_name"),
	pickedByType: text("picked_by_type"),
	pickedByName: text("picked_by_name"),
	pickedByContact: text("picked_by_contact"),
}, (table) => [
	index("idx_sale_batches_customer_region").using("btree", table.customerRegion.asc().nullsLast().op("text_ops")),
	index("idx_sale_batches_customer_type").using("btree", table.customerType.asc().nullsLast().op("text_ops")),
	index("idx_sale_batches_meter_type").using("btree", table.meterType.asc().nullsLast().op("text_ops")),
	index("idx_sale_batches_recipient").using("btree", table.recipient.asc().nullsLast().op("text_ops")),
	index("idx_sale_batches_recipient_trgm").using("gin", table.recipient.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_sale_batches_sale_date").using("btree", table.saleDate.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_sale_batches_transaction_id").using("btree", table.transactionId.asc().nullsLast().op("uuid_ops")),
	index("idx_sale_batches_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_sale_batches_user_name").using("btree", table.userName.asc().nullsLast().op("text_ops")),
	index("idx_sale_batches_user_name_trgm").using("gin", table.userName.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [userProfiles.id],
			name: "sale_batches_approved_by_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.noteBy],
			foreignColumns: [user.id],
			name: "sale_batches_note_by_user_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [salesTransactions.id],
			name: "sale_batches_transaction_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "sale_batches_user_id_user_id_fk"
		}),
	pgPolicy("Everyone can create sale batches", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(auth.uid() IS NOT NULL)`  }),
	pgPolicy("Everyone can view sale batches", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Only admins can delete sale batches", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Only admins can update sale batches", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("positive_batch_amount", sql`batch_amount > 0`),
	check("positive_total_price", sql`total_price > (0)::numeric`),
	check("positive_unit_price", sql`unit_price > (0)::numeric`),
	check("sale_batches_picked_by_type_check", sql`(picked_by_type IS NULL) OR (picked_by_type = ANY (ARRAY['customer'::text, 'rider'::text]))`),
]);

export const salesTransactions = pgTable("sales_transactions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: text("user_id").notNull(),
	userName: text("user_name").notNull(),
	saleDate: timestamp("sale_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	destination: text().notNull(),
	recipient: text().notNull(),
	customerType: text("customer_type"),
	customerCounty: text("customer_county"),
	customerContact: text("customer_contact"),
	referenceNumber: text("reference_number").notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	customerRegion: text("customer_region"),
}, (table) => [
	index("idx_sales_transactions_reference_number").using("btree", table.referenceNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "sales_transactions_user_id_user_id_fk"
		}),
	pgPolicy("Everyone can view sales transactions", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Everyone can create sales transactions", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Only admins can update sales transactions", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Only admins can delete sales transactions", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const soldMeters = pgTable("sold_meters", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	meterId: uuid("meter_id").notNull(),
	soldBy: text("sold_by").notNull(),
	soldAt: timestamp("sold_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	destination: text().notNull(),
	recipient: text().notNull(),
	serialNumber: text("serial_number").notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	batchId: uuid("batch_id").notNull(),
	customerType: text("customer_type"),
	customerCounty: text("customer_county"),
	customerContact: text("customer_contact"),
	status: text().default('active').notNull(),
	replacementSerial: text("replacement_serial"),
	replacementDate: timestamp("replacement_date", { withTimezone: true, mode: 'string' }),
	replacementBy: text("replacement_by"),
	customerRegion: text("customer_region"),
}, (table) => [
	index("idx_sold_meters_batch_id").using("btree", table.batchId.asc().nullsLast().op("uuid_ops")),
	index("idx_sold_meters_batch_id_status").using("btree", table.batchId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_sold_meters_serial_number").using("btree", table.serialNumber.asc().nullsLast().op("text_ops")),
	index("idx_sold_meters_sold_at").using("btree", table.soldAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_sold_meters_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [saleBatches.id],
			name: "sold_meters_batch_id_fkey"
		}),
	foreignKey({
			columns: [table.soldBy],
			foreignColumns: [user.id],
			name: "sold_meters_sold_by_user_id_fk"
		}),
	pgPolicy("Everyone can record sold meters", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(auth.uid() IS NOT NULL)`  }),
	pgPolicy("Everyone can view sold meters", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Only admins can delete sold meters", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Only admins can update sold meters", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("positive_unit_price_sold", sql`unit_price > (0)::numeric`),
	check("sold_meters_status_check", sql`status = ANY (ARRAY['active'::text, 'faulty'::text, 'returned'::text, 'replaced'::text])`),
	check("valid_status", sql`status = ANY (ARRAY['active'::text, 'faulty'::text, 'replaced'::text])`),
]);

export const faultyReturns = pgTable("faulty_returns", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	serialNumber: text("serial_number").notNull(),
	type: text().notNull(),
	returnedBy: text("returned_by"),
	returnedAt: timestamp("returned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	returnerName: text("returner_name"),
	originalSaleId: uuid("original_sale_id"),
	faultDescription: text("fault_description"),
	status: text().default('pending'),
	isBinned: boolean("is_binned").default(false),
	binnedAt: timestamp("binned_at", { mode: 'string' }),
	binnedBy: text("binned_by"),
	binnedByName: text("binned_by_name"),
}, (table) => [
	index("idx_faulty_returns_serial_number").using("btree", table.serialNumber.asc().nullsLast().op("text_ops")),
	index("idx_faulty_returns_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.originalSaleId],
			foreignColumns: [soldMeters.id],
			name: "faulty_returns_original_sale_id_fkey"
		}),
	unique("faulty_returns_serial_number_key").on(table.serialNumber),
	pgPolicy("Enable delete for admins only", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((auth.uid() IS NOT NULL) AND (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text))` }),
	pgPolicy("Enable insert for authenticated users", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Enable read access for all authenticated users", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Enable update for admins only", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("faulty_returns_status_check", sql`status = ANY (ARRAY['pending'::text, 'repaired'::text, 'unrepairable'::text])`),
]);

export const saleBatchAuditLog = pgTable("sale_batch_audit_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	saleBatchId: uuid("sale_batch_id").notNull(),
	action: text().notNull(),
	performedBy: text("performed_by").notNull(),
	performedByName: text("performed_by_name").notNull(),
	performedAt: timestamp("performed_at", { mode: 'string' }).defaultNow(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	updateRequestId: uuid("update_request_id"),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.saleBatchId],
			foreignColumns: [saleBatches.id],
			name: "sale_batch_audit_log_sale_batch_id_sale_batches_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updateRequestId],
			foreignColumns: [saleBatchUpdateRequests.id],
			name: "sale_batch_audit_log_update_request_id_sale_batch_update_reques"
		}),
]);

export const saleBatchUpdateRequests = pgTable("sale_batch_update_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	saleBatchId: uuid("sale_batch_id").notNull(),
	requestedBy: text("requested_by").notNull(),
	requestedByName: text("requested_by_name").notNull(),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow(),
	status: updateRequestStatus().default('pending'),
	approvedBy: text("approved_by"),
	approvedByName: text("approved_by_name"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	updateReason: text("update_reason").notNull(),
	changes: jsonb().notNull(),
	newSaleDate: timestamp("new_sale_date", { mode: 'string' }),
	newUnitPrice: numeric("new_unit_price", { precision: 10, scale:  2 }),
	newTotalPrice: numeric("new_total_price", { precision: 10, scale:  2 }),
}, (table) => [
	index("idx_sale_batch_update_requests_sale_batch_id").using("btree", table.saleBatchId.asc().nullsLast().op("uuid_ops")),
	index("idx_sale_batch_update_requests_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.saleBatchId],
			foreignColumns: [saleBatches.id],
			name: "sale_batch_update_requests_sale_batch_id_sale_batches_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: text().notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	readBy: text("read_by").array().default(["RAY"]),
	metadata: jsonb().default({}),
	createdBy: text("created_by"),
	isRead: boolean("is_read").default(false),
}, (table) => [
	index("idx_notifications_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_notifications_is_read").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("notifications_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("notifications_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	pgPolicy("Allow authenticated users to create notifications", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`true`  }),
	pgPolicy("Allow authenticated users to read notifications", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Allow users to update notifications", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const clientProspects = pgTable("client_prospects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	salesPersonId: text("sales_person_id").notNull(),
	salesPersonName: text("sales_person_name").notNull(),
	clientName: text("client_name").notNull(),
	location: text().notNull(),
	contact: text().notNull(),
	status: prospectStatus().default('prospect').notNull(),
	otherRemarks: text("other_remarks"),
	meterType: text("meter_type").notNull(),
	numberOfMeters: integer("number_of_meters").default(1).notNull(),
	latitude: numeric({ precision: 10, scale:  7 }),
	longitude: numeric({ precision: 10, scale:  7 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	changeHistory: jsonb("change_history").default([]),
	placeName: text("place_name"),
}, (table) => [
	index("idx_client_prospects_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_client_prospects_sales_person_id").using("btree", table.salesPersonId.asc().nullsLast().op("text_ops")),
	index("idx_client_prospects_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.salesPersonId],
			foreignColumns: [user.id],
			name: "client_prospects_sales_person_id_user_id_fk"
		}).onDelete("cascade"),
]);
