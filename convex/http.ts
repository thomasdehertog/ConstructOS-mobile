import { httpRouter } from "convex/server";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Route to serve generated HTML reports from Convex storage
http.route({
  path: "/getReport",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const storageIdString = searchParams.get("id");

    if (!storageIdString) {
      return new Response("Missing 'id' query parameter", { status: 400 });
    }

    // Ensure the storageIdString is a valid Id<"_storage">
    // This basic check can be enhanced with more robust validation if needed
    let storageId: Id<"_storage">;
    try {
      storageId = storageIdString as Id<"_storage">; // Basic assertion
      // For more robust validation, you might want to check the format or 
      // attempt a get and catch errors if it's not a valid storage ID format.
    } catch (e) {
      return new Response("Invalid 'id' query parameter format", { status: 400 });
    }

    const blob = await ctx.storage.get(storageId);
    if (blob === null) {
      return new Response("Report not found", { status: 404 });
    }
    // Explicitly get the text content from the blob
    const reportHtml = await blob.text();

    // Return the HTML string with explicit HTML content type header
    return new Response(reportHtml, {
      status: 200, // Ensure status 200 for success
      headers: {
        "Content-Type": "text/html",
        // "Cache-Control": "public, max-age=3600", 
      },
    });
  }),
});

// Fallback for any other routes - can be customized or removed
// http.route({
//   path: "/",
//   method: "GET",
//   handler: httpAction(async () => {
//     return new Response("Hello from Convex HTTP!", {
//       headers: { "content-type": "text/plain" },
//     });
//   }),
// });

export default http; 