import { relations } from "drizzle-orm/relations";
import { user, twoFactor, agents, agentInventory, agentTransactions, usersInAuth, meterPurchaseBatches, meters, userProfiles, session, account, salesTransactions, saleBatches, soldMeters, faultyReturns, notifications, saleBatchAuditLog, saleBatchUpdateRequests, clientProspects } from "./schema";

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user_userId: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
		relationName: "twoFactor_userId_user_id"
	}),
	user_userId: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
		relationName: "twoFactor_userId_user_id"
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	twoFactors_userId: many(twoFactor, {
		relationName: "twoFactor_userId_user_id"
	}),
	sessions: many(session),
	accounts: many(account),
	twoFactors_userId: many(twoFactor, {
		relationName: "twoFactor_userId_user_id"
	}),
	clientProspects: many(clientProspects),
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

export const agentTransactionsRelations = relations(agentTransactions, ({one}) => ({
	agent: one(agents, {
		fields: [agentTransactions.agentId],
		references: [agents.id]
	}),
}));

export const meterPurchaseBatchesRelations = relations(meterPurchaseBatches, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [meterPurchaseBatches.addedBy],
		references: [usersInAuth.id]
	}),
	meters: many(meters),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	meterPurchaseBatches: many(meterPurchaseBatches),
	meters: many(meters),
	userProfiles: many(userProfiles),
	soldMeters: many(soldMeters),
	faultyReturns: many(faultyReturns),
	notifications: many(notifications),
}));

export const metersRelations = relations(meters, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [meters.addedBy],
		references: [usersInAuth.id]
	}),
	meterPurchaseBatch: one(meterPurchaseBatches, {
		fields: [meters.batchId],
		references: [meterPurchaseBatches.id]
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userProfiles.id],
		references: [usersInAuth.id]
	}),
	salesTransactions: many(salesTransactions),
	saleBatches_approvedBy: many(saleBatches, {
		relationName: "saleBatches_approvedBy_userProfiles_id"
	}),
	saleBatches_noteBy: many(saleBatches, {
		relationName: "saleBatches_noteBy_userProfiles_id"
	}),
	saleBatches_userId: many(saleBatches, {
		relationName: "saleBatches_userId_userProfiles_id"
	}),
	soldMeters: many(soldMeters),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const salesTransactionsRelations = relations(salesTransactions, ({one, many}) => ({
	userProfile: one(userProfiles, {
		fields: [salesTransactions.userId],
		references: [userProfiles.id]
	}),
	saleBatches: many(saleBatches),
}));

export const saleBatchesRelations = relations(saleBatches, ({one, many}) => ({
	userProfile_approvedBy: one(userProfiles, {
		fields: [saleBatches.approvedBy],
		references: [userProfiles.id],
		relationName: "saleBatches_approvedBy_userProfiles_id"
	}),
	userProfile_noteBy: one(userProfiles, {
		fields: [saleBatches.noteBy],
		references: [userProfiles.id],
		relationName: "saleBatches_noteBy_userProfiles_id"
	}),
	salesTransaction: one(salesTransactions, {
		fields: [saleBatches.transactionId],
		references: [salesTransactions.id]
	}),
	userProfile_userId: one(userProfiles, {
		fields: [saleBatches.userId],
		references: [userProfiles.id],
		relationName: "saleBatches_userId_userProfiles_id"
	}),
	soldMeters: many(soldMeters),
	saleBatchAuditLogs: many(saleBatchAuditLog),
	saleBatchUpdateRequests: many(saleBatchUpdateRequests),
}));

export const soldMetersRelations = relations(soldMeters, ({one, many}) => ({
	saleBatch: one(saleBatches, {
		fields: [soldMeters.batchId],
		references: [saleBatches.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [soldMeters.replacementBy],
		references: [usersInAuth.id]
	}),
	userProfile: one(userProfiles, {
		fields: [soldMeters.soldBy],
		references: [userProfiles.id]
	}),
	faultyReturns: many(faultyReturns),
}));

export const faultyReturnsRelations = relations(faultyReturns, ({one}) => ({
	soldMeter: one(soldMeters, {
		fields: [faultyReturns.originalSaleId],
		references: [soldMeters.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [faultyReturns.returnedBy],
		references: [usersInAuth.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [notifications.createdBy],
		references: [usersInAuth.id]
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