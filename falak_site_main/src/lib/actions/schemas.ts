import { z } from "zod"

// Common
export const uuid = z.string().uuid()
export const timestamp = z.string().datetime().or(z.date())
export const bool = z.boolean()
export const text = z.string().min(1)
export const nullableText = z.string().nullable().optional()
export const email = z.string().email()
export const phone = z.string().min(6)
export const numeric = z.number().or(z.string().regex(/^\d+(\.\d+)?$/))

// Admin_roles
export const AdminRoleSchema = z.object({
  id: uuid.optional(),
  email,
  name: text,
  role: text,
  created_at: timestamp.optional(),
})
export const AdminRoleCreateSchema = AdminRoleSchema.omit({ id: true, created_at: true })
export const AdminRoleUpdateSchema = AdminRoleSchema.partial().extend({ id: uuid })

// Edit_logs
export const EditLogSchema = z.object({
  id: uuid.optional(),
  editById: uuid,
  edited_table: text,
  comments: text,
  date: z.coerce.date(),
  created_at: timestamp.optional(),
  edit_by_email: email,
  esdit_by_name: text,
})
export const EditLogCreateSchema = EditLogSchema.omit({ id: true, created_at: true })
export const EditLogUpdateSchema = EditLogSchema.partial().extend({ id: uuid })

// Events
export const EventSchema = z.object({
  id: uuid.optional(),
  sub_cluster: text,
  name: text,
  description: nullableText,
  rules: nullableText,
  date: z.coerce.date(),
  time: z.string(),
  venue: text,
  created_at: timestamp.optional(),
  cluster_name: nullableText,
  enable: z.boolean().optional(),
  min_team_size: numeric.optional(),
  max_team_size: numeric.optional(),
  cloudinary_url: nullableText,
})
export const EventCreateSchema = EventSchema.omit({ id: true, created_at: true })
export const EventUpdateSchema = EventSchema.partial().extend({ id: uuid })

// Pass
export const PassSchema = z.object({
  id: uuid.optional(),
  pass_name: text,
  cost: numeric,
  status: z.boolean().default(false).optional(),
  quanatity: numeric.optional(),
  edited_at: timestamp.optional(),
  enable: z.boolean().optional(),
  description: nullableText,
  event_id: uuid.optional(),
  mahe: z.boolean().optional(),
})
export const PassCreateSchema = PassSchema.omit({ id: true, edited_at: true })
export const PassUpdateSchema = PassSchema.partial().extend({ id: uuid })

// Teams
export const TeamSchema = z.object({
  id: uuid.optional(),
  eventId: uuid,
  name: text,
  captainId: uuid,
  updated_at: timestamp.optional(),
  active: z.boolean().optional(),
})
export const TeamCreateSchema = TeamSchema.omit({ id: true, updated_at: true })
export const TeamUpdateSchema = TeamSchema.partial().extend({ id: uuid })

// Team_members
export const TeamMemberSchema = z.object({
  id: uuid.optional(),
  teamId: uuid,
  memberId: uuid,
  eventId: uuid,
  updated_at: timestamp.optional(),
})
export const TeamMemberCreateSchema = TeamMemberSchema.omit({ id: true, updated_at: true })
export const TeamMemberUpdateSchema = TeamMemberSchema.partial().extend({ id: uuid })

// Tickets
export const TicketSchema = z.object({
  id: uuid.optional(),
  created_at: timestamp.optional(),
  userId: uuid,
  category: text,
  issue: text,
  status: text.optional(),
  solved: z.boolean().optional(),
})
export const TicketCreateSchema = TicketSchema.omit({ id: true, created_at: true })
export const TicketUpdateSchema = TicketSchema.partial().extend({ id: uuid })

// User_passes
export const UserPassSchema = z.object({
  id: uuid.optional(),
  userId: uuid,
  passId: uuid,
  created_at: timestamp.optional(),
  active: z.boolean().optional(),
  qr_token: z.string().nullable().optional(),
})
export const UserPassCreateSchema = UserPassSchema.omit({ id: true, created_at: true })
export const UserPassUpdateSchema = UserPassSchema.partial().extend({ id: uuid })

// Users
export const UserSchema = z.object({
  id: uuid.optional(),
  created_at: timestamp.optional(),
  name: text,
  phone: z.string().min(6),
  email: email,
  mahe: z.boolean(),
  reg_no: z.string().nullable().optional(),
  qr: z.string().nullable().optional(),
  institute: z.string().nullable().optional(),
  active: z.boolean().optional(),
})
export const UserCreateSchema = UserSchema.omit({ id: true, created_at: true })
export const UserUpdateSchema = UserSchema.partial().extend({ id: uuid })

// redeemed_passes
export const RedeemedPassSchema = z.object({
  id: uuid.optional(),
  created_at: timestamp.optional(),
  phone: text,
  pass_id: uuid,
  user_id: uuid,
  purchase_id: text,
})
export const RedeemedPassCreateSchema = RedeemedPassSchema.omit({ id: true, created_at: true })
export const RedeemedPassUpdateSchema = RedeemedPassSchema.partial().extend({ id: uuid })
