// Constants import for defining days of the week in order
import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants"
import { relations } from "drizzle-orm"
import { boolean, Index, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

// Common timestamp columns for created and updated records
const createdAt = timestamp("createdAt").notNull().defaultNow()
const updatedAt = timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date)
// EventTable holds event-specific data like name, description, duration, user association, and status.
export const EventTable = pgTable("events", {
    id: uuid("id").primaryKey().defaultRandom(), // Primary key, uses random UUID for uniqueness
    name: text("name").notNull(), // Event name, required field
    description: text("description"), // Optional description of the event
    durationInMinutes: integer("durationInMinutes").notNull(), // Event duration in minutes, required
    clerkUserId: text("clerkUserId").notNull(), // Foreign key to associate event with a user from Clerk (authentication)
    isActive: boolean("isActive").notNull().default(true), // Event status: active or inactive, defaults to true (active)
    createdAt, // Timestamp for event creation
    updatedAt, // Timestamp for event updates
}, table => ({
    clerkUserIdIndex: index("clerkUserIdIndex").on(table.clerkUserId), // Index on clerkUserId to speed up user-based queries
})
)

// ScheduleTable stores schedule data for users, linked by Clerk user ID.
export const ScheduleTable = pgTable("schedules", {
    id: uuid("id").primaryKey().defaultRandom(), // Primary key, random UUID for uniqueness
    timezone: text("timezone").notNull(), // User's timezone, required field
    clerkUserId: text("clerkUserId").notNull().unique(), // Foreign key linking the schedule to a unique Clerk user, enforces one schedule per user
    createdAt, // Timestamp for schedule creation
    updatedAt, // Timestamp for schedule updates
})

// Defines the relationship between Schedule and its associated availabilities (one-to-many)
export const scheduleRelations = relations(ScheduleTable,({ many }) => ({
    availabilities: many(ScheduleAvailabilityTable) // A schedule can have multiple availability entries
}) )

// Enum to define the days of the week, using pre-defined order of days from the constants
export const scheduleDayOfWeekEnum = pgEnum("day", DAYS_OF_WEEK_IN_ORDER)

// ScheduleAvailabilityTable stores available time slots per day for each user’s schedule.
export const ScheduleAvailabilityTable = pgTable("scheduleAvailabilities", {
    id: uuid("id").primaryKey().defaultRandom(), // Primary key, random UUID for uniqueness
    scheduleId: uuid("scheduleId").notNull().references(() => ScheduleTable.id, { onDelete: "cascade"}), // Foreign key referencing ScheduleTable, cascades on delete to remove associated availabilities
    startTime: text("startTime").notNull(), // Start time of the availability slot (e.g., "09:00 AM")
    endTime: text("endTime").notNull(), // End time of the availability slot (e.g., "05:00 PM")
    dayOfWeek: scheduleDayOfWeekEnum("dayOfWeek").notNull(), // Day of the week for the availability (e.g., Monday)
},
table => ({
    scheduleIdIndex: index("scheduleIndex").on(table.scheduleId) // Index on scheduleId to optimize queries for availability by schedule
}))

// Defines the relationship between ScheduleAvailability and its parent Schedule (many-to-one)
export const ScheduleAvailabilityRelations = relations(ScheduleAvailabilityTable, ({ one }) => ({
    schedule: one(ScheduleTable, {
        fields: [ScheduleAvailabilityTable.scheduleId], // Fields to link with the foreign key
        references: [ScheduleTable.id] // References the primary key in the ScheduleTable
    })
}))
