import { pgTable, text, timestamp, boolean, jsonb, decimal, pgEnum, date, time, integer, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from "next-auth/adapters";
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'manager', 'finance']);
export const repairStatusEnum = pgEnum('repair_status', [
    'pending_check',
    'pending_send',
    'repairing',
    'repair_done',
    'pending_payment',
    'ready_to_ship',
    'completed'
]);
export const returnMethodEnum = pgEnum('return_method', ['pickup', 'mail']);

// Users Table (NextAuth)
export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    // Custom fields
    role: userRoleEnum('role').default('customer').notNull(),
    mobile: text('mobile'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Accounts Table (NextAuth)
export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

// Sessions Table (NextAuth)
export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Verification Tokens Table (NextAuth)
export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

// Addresses Table
export const addresses = pgTable('addresses', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    province: text('province').notNull(),
    district: text('district').notNull(), // Khet/Amphoe
    subDistrict: text('sub_district').notNull(), // Kwaeng/Tambon
    postalCode: text('postal_code').notNull(),
    details: text('details'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// Repairs Table
export const repairs = pgTable('repairs', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    customerId: text('customer_id').references(() => users.id),
    status: repairStatusEnum('status').default('pending_check'),

    // Item Details
    items: jsonb('items').notNull(), // Array of { description, images[], plating(bool) }
    returnMethod: returnMethodEnum('return_method').notNull(),

    // Logistics
    trackingNumber: text('tracking_number'),

    // Pricing
    costInternal: decimal('cost_internal', { precision: 10, scale: 2 }),
    costExternal: decimal('cost_external', { precision: 10, scale: 2 }),
    discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    completedAt: timestamp('completed_at'),
});

export const thaiLocations = pgTable('thai_locations', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    province: text('province').notNull(),
    amphoe: text('amphoe').notNull(),
    tambon: text('tambon').notNull(),
    zipcode: text('zipcode').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    repairs: many(repairs),
    addresses: many(addresses),
}));

export const repairsRelations = relations(repairs, ({ one }) => ({
    customer: one(users, {
        fields: [repairs.customerId],
        references: [users.id],
    }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
    user: one(users, {
        fields: [addresses.userId],
        references: [users.id],
    }),
}));
