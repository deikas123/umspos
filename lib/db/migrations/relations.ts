import { relations } from "drizzle-orm/relations";
import { agentTransactions, agentTransactionMeters, agents, agentInventory, meterPurchaseBatches, meters, usersInAuth, userProfiles, user, session, account, twoFactor, saleBatches, salesTransactions, soldMeters, faultyReturns, saleBatchAuditLog, saleBatchUpdateRequests, clientProspects } from "./schema";

export const agentTransactionMetersRelations = relations(agentTransactionMeters, ({one}) => ({
	agentTransaction: one(agentTransactions, {
		fields: [agentTransactionMeters.transactionId],
		references: [agentTransactions.id]
	}),
}));

export const agentTransactionsRelations = relations(agentTransactions, ({one, many}) => ({
	agentTransactionMeters: many(agentTransactionMeters),
	agent: one(agents, {
		fields: [agentTransactions.agentId],
		references: [agents.id]
	}),
}));

export const agentInventoryRelations = relations(agentInventory, ({one}) => ({
	agent: one(agents, {
		fields: [agentInventory.agentId],
		references: [agents.id]
	}),
}));

export const agentsRelations = relations(agents, ({many}) => ({
	agentInventories: many(agentInventory),
	agentTransactions: many(agentTransactions),
}));

export const metersRelations = relations(meters, ({one}) => ({
	meterPurchaseBatch: one(meterPurchaseBatches, {
		fields: [meters.batchId],
		references: [meterPurchaseBatches.id]
	}),
}));

export const meterPurchaseBatchesRelations = relations(meterPurchaseBatches, ({many}) => ({
	meters: many(meters),
}));

export const userProfilesRelations = relations(userProfiles, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userProfiles.id],
		references: [usersInAuth.id]
	}),
	saleBatches: many(saleBatches),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	userProfiles: many(userProfiles),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
	twoFactors: many(twoFactor),
	saleBatches_noteBy: many(saleBatches, {
		relationName: "saleBatches_noteBy_user_id"
	}),
	saleBatches_userId: many(saleBatches, {
		relationName: "saleBatches_userId_user_id"
	}),
	salesTransactions: many(salesTransactions),
	soldMeters: many(soldMeters),
	clientProspects: many(clientProspects),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id]
	}),
}));

export const saleBatchesRelations = relations(saleBatches, ({one, many}) => ({
	userProfile: one(userProfiles, {
		fields: [saleBatches.approvedBy],
		references: [userProfiles.id]
	}),
	user_noteBy: one(user, {
		fields: [saleBatches.noteBy],
		references: [user.id],
		relationName: "saleBatches_noteBy_user_id"
	}),
	salesTransaction: one(salesTransactions, {
		fields: [saleBatches.transactionId],
		references: [salesTransactions.id]
	}),
	user_userId: one(user, {
		fields: [saleBatches.userId],
		references: [user.id],
		relationName: "saleBatches_userId_user_id"
	}),
	soldMeters: many(soldMeters),
	saleBatchAuditLogs: many(saleBatchAuditLog),
	saleBatchUpdateRequests: many(saleBatchUpdateRequests),
}));

export const salesTransactionsRelations = relations(salesTransactions, ({one, many}) => ({
	saleBatches: many(saleBatches),
	user: one(user, {
		fields: [salesTransactions.userId],
		references: [user.id]
	}),
}));

export const soldMetersRelations = relations(soldMeters, ({one, many}) => ({
	saleBatch: one(saleBatches, {
		fields: [soldMeters.batchId],
		references: [saleBatches.id]
	}),
	user: one(user, {
		fields: [soldMeters.soldBy],
		references: [user.id]
	}),
	faultyReturns: many(faultyReturns),
}));

export const faultyReturnsRelations = relations(faultyReturns, ({one}) => ({
	soldMeter: one(soldMeters, {
		fields: [faultyReturns.originalSaleId],
		references: [soldMeters.id]
	}),
}));

export const saleBatchAuditLogRelations = relations(saleBatchAuditLog, ({one}) => ({
	saleBatch: one(saleBatches, {
		fields: [saleBatchAuditLog.saleBatchId],
		references: [saleBatches.id]
	}),
	saleBatchUpdateRequest: one(saleBatchUpdateRequests, {
		fields: [saleBatchAuditLog.updateRequestId],
		references: [saleBatchUpdateRequests.id]
	}),
}));

export const saleBatchUpdateRequestsRelations = relations(saleBatchUpdateRequests, ({one, many}) => ({
	saleBatchAuditLogs: many(saleBatchAuditLog),
	saleBatch: one(saleBatches, {
		fields: [saleBatchUpdateRequests.saleBatchId],
		references: [saleBatches.id]
	}),
}));

export const clientProspectsRelations = relations(clientProspects, ({one}) => ({
	user: one(user, {
		fields: [clientProspects.salesPersonId],
		references: [user.id]
	}),
}));