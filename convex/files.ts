import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Mutation to generate a URL for uploading a file
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Query to get a file URL from a storage ID
export const getStoredFileUrl = query({
  args: { storageId: v.string() }, // Assuming storageId is passed as a string
  handler: async (ctx, args) => {
    // Attempt to get the URL. It can be null if the file doesn't exist or isn't accessible.
    const url = await ctx.storage.getUrl(args.storageId as Id<"_storage">); // Cast to Id<"_storage"> if necessary
    return url;
  },
});

// You might also want a mutation to delete files if needed later
// export const deleteFile = mutation({
//   args: { storageId: v.id("_storage") },
//   handler: async (ctx, args) => {
//     await ctx.storage.delete(args.storageId);
//   },
// }); 