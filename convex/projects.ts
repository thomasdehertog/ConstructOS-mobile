import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";

// Define reusable object types for args to match schema
const observationObjectArg = v.object({
  id: v.string(),
  title: v.string(),
  content: v.string(),
  imageUri: v.optional(v.string()),
});

const recommendationObjectArg = v.object({
  id: v.string(),
  text: v.string(),
});

// Get a single project by its ID
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);

    if (project) {
      // Resolve coverPhotoUri to a full URL
      if (project.coverPhotoUri) {
        const fullUrl = await ctx.storage.getUrl(project.coverPhotoUri as Id<"_storage">);
        (project as any).coverPhotoFullUrl = fullUrl;
      }

      // Resolve imageUris within observations to full URLs
      if (project.observations && project.observations.length > 0) {
        const currentObservations = project.observations;
        const updatedObservationsPromises = currentObservations.map(async (obs) => {
          if (obs.imageUri) {
            const fullImageUrl = await ctx.storage.getUrl(obs.imageUri as Id<"_storage">);
            return { ...obs, imageFullUrl: fullImageUrl };
          }
          return obs;
        });
        project.observations = await Promise.all(updatedObservationsPromises);
      }
    }
    return project;
  },
});

// Get all projects, ordered by creation time (newest first)
export const getAllProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").collect();
    return projects;
  },
});

// Creates a new project based on a selected template
export const createProjectFromTemplate = mutation({
  args: {
    name: v.string(),
    originalTemplateId: v.string(),
    originalTemplateTitle: v.string(),
    userId: v.optional(v.string()), // Make this v.optional(v.id("users")) if you have a users table
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      originalTemplateId: args.originalTemplateId,
      originalTemplateTitle: args.originalTemplateTitle,
      userId: args.userId,
      // Initialize new array fields as empty or with defaults
      observations: [],
      recommendations: [],
      // Other fields will be undefined by default as per schema v.optional
    });
    return projectId;
  },
});

// Mutation to update existing project details
export const updateProjectDetails = mutation({
  args: {
    projectId: v.id("projects"),
    updates: v.object({
      projectType: v.optional(v.string()),
      inspectionDate: v.optional(v.string()),
      siteAddress: v.optional(v.string()),
      siteName: v.optional(v.string()),
      clientName: v.optional(v.string()),
      inspectorName: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { projectId, updates } = args;
    // Ensure that we don\'t try to update with undefined values if they are not provided
    // The schema with v.optional handles this at the database level, but good practice.
    const validUpdates: Partial<typeof updates> = {};
    (Object.keys(updates) as Array<keyof typeof updates>).forEach((key) => {
      if (updates[key] !== undefined) {
        (validUpdates as any)[key] = updates[key];
      }
    });

    await ctx.db.patch(projectId, validUpdates);
    // Optionally, return a success status or the updated document id
    return { success: true, projectId };
  },
});

// --- Mutations for specific project fields/sections ---

export const setCoverPhoto = mutation({
  args: {
    projectId: v.id("projects"),
    coverPhotoStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { coverPhotoUri: args.coverPhotoStorageId });
    return { success: true };
  },
});

export const updateSiteDescriptionText = mutation({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { siteDescriptionText: args.text });
    return { success: true };
  },
});

export const updateScopeOfEvaluationText = mutation({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { scopeOfEvaluationText: args.text });
    return { success: true };
  },
});

export const updateConclusionsText = mutation({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { conclusionsText: args.text });
    return { success: true };
  },
});

// --- Observation Mutations ---
export const addObservation = mutation({
  args: {
    projectId: v.id("projects"),
    observation: observationObjectArg, // Use defined arg type
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const currentObservations = project.observations || [];
    
    // Explicitly construct the new observation object to ensure type compatibility
    const newObservationToAdd = {
      id: args.observation.id,
      title: args.observation.title,
      content: args.observation.content,
      // Conditionally add imageUri if it exists, to match optional field type
      ...(args.observation.imageUri !== undefined && { imageUri: args.observation.imageUri }),
    };

    currentObservations.push(newObservationToAdd); 
    await ctx.db.patch(args.projectId, { observations: currentObservations });
    return { success: true, observationId: args.observation.id };
  },
});

export const updateObservation = mutation({
  args: {
    projectId: v.id("projects"),
    observationId: v.string(),
    updates: v.object({ // Only allow updating specific fields of an observation
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      imageUri: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const observations = project.observations?.map(obs => {
      if (obs.id === args.observationId) {
        return { ...obs, ...args.updates };
      }
      return obs;
    });
    if (!observations) throw new Error("Observations array not found or update failed");
    await ctx.db.patch(args.projectId, { observations });
    return { success: true };
  },
});

export const removeObservation = mutation({
  args: {
    projectId: v.id("projects"),
    observationId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const observations = project.observations?.filter(obs => obs.id !== args.observationId);
    await ctx.db.patch(args.projectId, { observations });
    return { success: true };
  },
});

// --- Recommendation Mutations ---
export const updateRecommendationsList = mutation({
  args: {
    projectId: v.id("projects"),
    recommendations: v.array(recommendationObjectArg), // Use defined arg type
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { recommendations: args.recommendations as Doc<"projects">["recommendations"] });
    return { success: true };
  },
});

// Internal query to fetch project data specifically for report generation by the Node action
export const getProjectForReport = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error(`Project not found: ${args.projectId}`);
    }
    // Optionally, fetch and pre-process related data if needed, e.g., user details
    // For now, just return the project document
    return project;
  },
});

// NEW MUTATION to save the generated report URL
export const updateGeneratedReportUrl = mutation({
  args: {
    projectId: v.id("projects"),
    reportUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { generatedReportUrl: args.reportUrl });
    return { success: true };
  },
});

// You can add other project-related mutations here later, like:
// - addDataItemToProject
// - deleteProject 