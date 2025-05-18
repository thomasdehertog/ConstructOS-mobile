"use node";

import { v } from "convex/values"; // Import v for defining argument types
import Handlebars from 'handlebars'; // Import Handlebars
import { api } from "./_generated/api"; // Import api for calling mutations
import { action } from "./_generated/server";

// Action to upload the HTML report template content to Convex storage.
// Run this action ONCE manually (e.g., via the Convex dashboard).
// Paste the full content of your forensic-eval.hbs file into the 'templateString' argument.
// Note the returned storageId and use it in your reports.ts.
export const uploadHtmlReportTemplate = action({
  args: {
    templateString: v.string(), // Argument to accept the template content as a string
  },
  handler: async (ctx, { templateString }) => {
    const templateFileName = "forensic-eval.hbs"; // Still useful for console logging

    if (!templateString || templateString.trim() === "") {
      throw new Error("templateString argument cannot be empty.");
    }

    // Store the template content (as a Blob) in Convex storage
    // Encode the string to Uint8Array, then create Blob
    const templateBytes = new TextEncoder().encode(templateString);
    const templateBlob = new Blob([templateBytes], { type: "text/plain" }); // or text/x-handlebars-template
    
    const storageId = await ctx.storage.store(templateBlob);

    console.log(`Report template content for '${templateFileName}' uploaded successfully. Storage ID: ${storageId}`);
    return { storageId };
  },
}); 

// Action to generate an HTML report from a stored template and data, then store it.
export const generateAndStoreHtmlReport = action({
  args: {
    projectId: v.id("projects"), // <-- ADDED: ID of the project to update
    templateStorageId: v.id("_storage"), 
    reportData: v.any(), 
    outputFileName: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, templateStorageId, reportData, outputFileName }) => {
    // 1. Fetch the Handlebars template content from storage
    const templateBlob = await ctx.storage.get(templateStorageId);
    if (!templateBlob) {
      throw new Error(`Template with storage ID ${templateStorageId} not found.`);
    }
    const templateString = await templateBlob.text();

    // 2. Compile the template with the provided data
    const compiledTemplate = Handlebars.compile(templateString);
    const htmlOutput = compiledTemplate(reportData);

    // 3. Store the generated HTML content as a new Blob
    const htmlBlob = new Blob([htmlOutput], { type: "text/html" });
    const reportStorageId = await ctx.storage.store(htmlBlob);

    // 4. Get the direct URL for the stored report
    const reportUrl = await ctx.storage.getUrl(reportStorageId);
    if (!reportUrl) {
      // This case should be rare, but good to handle if getUrl could return null
      throw new Error(`Could not retrieve URL for stored report ${reportStorageId}`);
    }

    // 5. Save the direct report URL to the project document
    // This assumes you will create/have an internalMutation or mutation 
    // in projects.ts named 'updateGeneratedReportUrl'
    try {
      await ctx.runMutation(api.projects.updateGeneratedReportUrl, {
        projectId: projectId,
        reportUrl: reportUrl,
      });
    } catch (error) {
      console.error(`Failed to update project ${projectId} with report URL: ${reportUrl}`, error);
      // Decide if this should be a critical error or just a logged warning
      // For now, we'll let the action proceed and return the URL
    }

    const logFileName = outputFileName || "generated_report.html";
    console.log(`HTML report '${logFileName}' generated and stored. Storage ID: ${reportStorageId}, URL: ${reportUrl}`);
    
    // 6. Return the storage ID and the direct URL
    return { reportStorageId, reportUrl };
  },
}); 