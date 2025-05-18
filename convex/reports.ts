"use node"; // Mark this file for Node.js runtime for Convex actions

import { v } from "convex/values";
import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

// Define the expected return type for the action handler
interface GenerateReportReturnType {
  storageId: Id<"_storage">;
  url: string | null;
  generatedFileName: string; // Added for consistency, though HTML might not always need a complex name
}

// Helper to read template. In a real scenario, ensure 'templates' dir is in your deployment.
// For Convex, files in the project directory are usually bundled.
function getTemplateSrc(): string {
  try {
    // Construct path relative to the project root.
    const templatePath = path.join("templates", "forensic-eval.hbs");
    // console.log(`Attempting to read template from: ${templatePath}`); // Optional: for debugging
    return fs.readFileSync(templatePath, "utf-8");
  } catch (e) {
    console.error("Error reading HBS template:", e);
    // Add the attempted path to the error message for better debugging
    throw new Error(`Could not load report template from '${path.join("templates", "forensic-eval.hbs")}'. Ensure it exists at the root of your project in the 'templates' directory.`);
  }
}

// Pre-compile the template once when the module loads for efficiency
let compiledTemplate: HandlebarsTemplateDelegate<any>;
try {
    const templateSrc = getTemplateSrc();
    compiledTemplate = Handlebars.compile(templateSrc);
} catch (e) {
    console.error("Failed to compile Handlebars template on module load:", e);
    // Action will fail if template isn't compiled.
}

// getProjectForReport has been MOVED to convex/projects.ts

export const generateReport = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }): Promise<GenerateReportReturnType> => {
    if (!compiledTemplate) {
        console.error("Handlebars template was not compiled. Cannot generate report.");
        throw new Error("Report template compilation failed.");
    }

    // 1. Fetch project data
    // The getProjectForReport query already resolves coverPhotoUri and observation imageUris to storage URLs
    const project = await ctx.runQuery(internal.projects.getProjectForReport, { projectId });

    if (!project) {
      console.error(`Project data not found for ID: ${projectId}`);
      throw new Error("Project data could not be fetched for the report.");
    }

    // Data for Handlebars - project is directly used.
    // The template expects {{project.fieldName}}
    const templateData = {
        project: project // The query result from getProjectForReport contains all necessary fields
    };
    
    // 2. Render HTML
    let htmlString: string;
    try {
      htmlString = compiledTemplate(templateData);
    } catch (error: any) {
      console.error("Error rendering HTML with Handlebars:", error.message);
      throw new Error("Failed to render HTML report. Check template data and syntax.");
    }

    // 3. Store HTML in Convex storage
    const generatedFileNameBase: string = project.name ? project.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Untitled_Report';
    const generatedFileName: string = `${generatedFileNameBase}_${new Date().toISOString()}.html`;
    
    const htmlBytes = new TextEncoder().encode(htmlString);
    const reportBlob = new Blob([htmlBytes], { type: "text/html" }); 
    const storageId: Id<"_storage"> = await ctx.storage.store(reportBlob);

    // 4. Get shareable URL
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      console.error(`Failed to get URL for the generated HTML report (Storage ID: ${storageId}). URL will be null.`);
    }

    console.log(`HTML Report generated: ${generatedFileName}, URL: ${url || 'null'}`);
    return { storageId, url, generatedFileName };
  },
});

// TODO: You might want to add a mutation to save report metadata to the database
// e.g., internal.reports.addReportRecord if you create a 'reports' table 