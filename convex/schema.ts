import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const observationObject = v.object({
  id: v.string(), // Client-generated unique ID (e.g., UUID)
  title: v.string(),
  content: v.string(),
  imageUri: v.optional(v.string()),
  audioUri: v.optional(v.string()),
});

const recommendationObject = v.object({
  id: v.string(), // Client-generated unique ID
  text: v.string(),
});

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  projects: defineTable({
    name: v.string(),
    originalTemplateId: v.string(),
    originalTemplateTitle: v.string(),
    userId: v.optional(v.string()),
    projectType: v.optional(v.string()),
    inspectionDate: v.optional(v.string()),
    siteAddress: v.optional(v.string()),
    siteName: v.optional(v.string()),
    clientName: v.optional(v.string()),
    inspectorName: v.optional(v.string()),
    coverPhotoUri: v.optional(v.string()),
    siteDescriptionText: v.optional(v.string()),
    scopeOfEvaluationText: v.optional(v.string()),
    conclusionsText: v.optional(v.string()),
    observations: v.optional(v.array(observationObject)),
    recommendations: v.optional(v.array(recommendationObject)),
  }).index("by_user", ["userId"])
}); 