import { readFile } from "fs/promises";
import { join } from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Submission } from "@prisma/client";
import { existsSync } from "fs";
import { lightenColor } from "@/lib/utils";
import { getTemplateConfig, type TemplateConfig, type TemplateField } from "@/lib/template-registry";
import { prisma } from "@/lib/prisma";

// Helper function to convert file to base64 data URI
const fileToDataUri = async (filePath: string): Promise<string | null> => {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const fileBuffer = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase();
    let mimeType = "image/png";
    if (ext === "svg") mimeType = "image/svg+xml";
    else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    const base64 = fileBuffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
};

// Process assets (logos, decorations, etc.)
async function processAssets(
  html: string,
  config: TemplateConfig,
  submission: Submission,
  assetsDir: string
): Promise<string> {
  // Safety checks
  if (!config.assets || !config.assets.logo) {
    throw new Error("Config assets.logo is missing");
  }
  if (!config.assets.logo.default) {
    throw new Error("Config assets.logo.default is missing");
  }
  
  // Get logo file name (with swap logic)
  // Check both exact match and partial match (e.g., "code-a-quebec-thumbnail" should match "code-a-quebec")
  let logoFile = config.assets.logo.default;
  if (config.assets.logo.swap) {
    // Try exact match first
    if (config.assets.logo.swap[submission.templateFamily]) {
      logoFile = config.assets.logo.swap[submission.templateFamily];
    } else {
      // Try partial match (e.g., "code-a-quebec-thumbnail" -> "code-a-quebec")
      const templateBase = submission.templateFamily.split('-').slice(0, -1).join('-');
      if (templateBase && config.assets.logo.swap[templateBase]) {
        logoFile = config.assets.logo.swap[templateBase];
      }
    }
  }

  // Process src="assets/..." patterns
  const assetSrcRegex = /src="assets\/([^"]+)"/g;
  let assetSrcMatch;
  while ((assetSrcMatch = assetSrcRegex.exec(html)) !== null) {
    let assetFile = assetSrcMatch[1];
    if (assetFile === "speaker-photo.png") {
      continue; // Skip speaker-photo.png, will be replaced later
    }

    // Swap logo if needed
    if (assetFile === "mtl-code-wide.svg" && logoFile !== "mtl-code-wide.svg") {
      assetFile = logoFile;
    }

    const assetPath = join(assetsDir, assetFile);

    // Special handling for decoration.svg - replace primary color before converting
    if (assetFile === config.assets.decoration?.file) {
      let svgContent = await readFile(assetPath, "utf-8");
      // Replace colors from config
      if (config.assets.decoration.colorReplacements) {
        for (const color of config.assets.decoration.colorReplacements) {
          svgContent = svgContent.replace(new RegExp(color, "g"), submission.primaryColor);
        }
      }
      const base64 = Buffer.from(svgContent).toString("base64");
      const dataUri = `data:image/svg+xml;base64,${base64}`;
      html = html.replace(assetSrcMatch[0], `src="${dataUri}"`);
    } else {
      const dataUri = await fileToDataUri(assetPath);
      if (dataUri) {
        html = html.replace(assetSrcMatch[0], `src="${dataUri}"`);
      }
    }
  }

  // Process href="assets/..." patterns (SVG <image> elements)
  const assetHrefRegex = /href="assets\/([^"]+)"/g;
  let assetHrefMatch;
  while ((assetHrefMatch = assetHrefRegex.exec(html)) !== null) {
    let assetFile = assetHrefMatch[1];
    if (assetFile === "speaker-photo.png") {
      continue;
    }

    // Swap logo if needed
    if (assetFile === "mtl-code-wide.svg" && logoFile !== "mtl-code-wide.svg") {
      assetFile = logoFile;
    }

    const assetPath = join(assetsDir, assetFile);
    const dataUri = await fileToDataUri(assetPath);
    if (dataUri) {
      html = html.replace(assetHrefMatch[0], `href="${dataUri}"`);
    }
  }

  return html;
}

// Process fonts
async function processFonts(html: string): Promise<string> {
  const fontsDir = join(process.cwd(), "public", "fonts");
  const fontFaceCssPath = join(fontsDir, "font-face.css");

  if (!existsSync(fontFaceCssPath)) {
    return html;
  }

  let fontFaceCss = await readFile(fontFaceCssPath, "utf-8");
  const fontFileRegex = /url\(['"]?([^'")]+\.woff2?)['"]?\)/g;
  let fontFileMatch;
  const fontReplacements: Array<{ original: string; replacement: string }> = [];

  while ((fontFileMatch = fontFileRegex.exec(fontFaceCss)) !== null) {
    const fontFileName = fontFileMatch[1];
    const fontFilePath = join(fontsDir, fontFileName);

    if (existsSync(fontFilePath)) {
      const fontBuffer = await readFile(fontFilePath);
      const base64 = fontBuffer.toString("base64");
      const mimeType = fontFileName.endsWith(".woff2") ? "font/woff2" : "font/woff";
      const dataUri = `data:${mimeType};base64,${base64}`;
      fontReplacements.push({
        original: fontFileMatch[0],
        replacement: `url('${dataUri}')`,
      });
    }
  }

  for (const replacement of fontReplacements) {
    fontFaceCss = fontFaceCss.replace(replacement.original, replacement.replacement);
  }

  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="fonts\/font-face\.css">/i,
    `<style>${fontFaceCss}</style>`
  );

  return html;
}

// Format date based on config
function formatDate(field: TemplateField, date: Date): string {
  const formatStr = field.format || "EEEE, MMMM d";
  const locale = field.locale === "fr" ? fr : undefined;
  return format(date, formatStr, locale ? { locale } : undefined);
}

// Format time based on config
function formatTime(field: TemplateField, time24: string): string {
  const prefix = field.prefix || "";
  
  if (field.format === "12h") {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${prefix}${hour12}:${minutes}${ampm}`;
  }
  
  // 24h format
  return `${prefix}${time24}`;
}

// Replace field value in HTML
function replaceField(
  html: string,
  field: TemplateField,
  value: any,
  submission: Submission
): string {
  if (!field.replacements || field.replacements.length === 0) {
    return html;
  }

  let replacementValue: string;

  // Format value based on field type
  if (field.type === "date") {
    if (!value) {
      // If date is missing, return empty string or placeholder
      return html; // Don't replace if value is missing
    }
    try {
      const dateValue = value instanceof Date ? value : new Date(value);
      if (isNaN(dateValue.getTime())) {
        // Invalid date, don't replace
        console.warn(`Invalid date value for field ${field.name}: ${value}`);
        return html;
      }
      replacementValue = formatDate(field, dateValue);
    } catch (error) {
      console.error(`Error formatting date for field ${field.name}:`, error);
      return html; // Don't replace if date formatting fails
    }
  } else if (field.type === "time") {
    if (!value) {
      return html; // Don't replace if value is missing
    }
    replacementValue = formatTime(field, value);
  } else if (field.type === "color") {
    replacementValue = value || "#3D9DFF"; // Default color if missing
  } else {
    replacementValue = value || ""; // Default to empty string for text fields
  }

  // Apply all replacements for this field
  for (const replacement of field.replacements) {
    if (!replacement || !replacement.pattern) continue;
    if (replacement.regex) {
      // Use regex replacement
      const flags = replacement.flags || "g";
      const regex = new RegExp(replacement.regex, flags);
      html = html.replace(regex, replacementValue);
    } else {
      // Simple string replacement
      html = html.replace(new RegExp(replacement.pattern, "g"), replacementValue);
    }
  }

  return html;
}

// Process people fields
function processPeople(
  html: string,
  peopleField: TemplateField,
  people: any[],
  uploadUrls: string[]
): string {
  if (!peopleField.fields) {
    return html;
  }
  
  // Safety check: ensure people and uploadUrls are arrays
  if (!Array.isArray(people)) {
    people = [];
  }
  if (!Array.isArray(uploadUrls)) {
    uploadUrls = [];
  }

  // Helper to replace first occurrence (needs to be accessible to all iterations)
  const replaceFirst = (patterns: RegExp[], replacement: string): boolean => {
    for (const pattern of patterns) {
      if (html.match(pattern)) {
        html = html.replace(pattern, replacement);
        return true;
      }
    }
    return false;
  };

  for (let index = 0; index < people.length; index++) {
    const person = people[index];

    // Process each person field
    for (const personField of peopleField.fields) {
      if (personField.type === "image" && personField.name === "headshot") {
        // Handle headshot replacement
        const headshotDataUri = uploadUrls[index];
        if (headshotDataUri && personField.replacements && Array.isArray(personField.replacements)) {
          for (const replacement of personField.replacements) {
            if (!replacement || !replacement.pattern) continue;
            // Escape special regex characters in pattern
            const escapedPattern = replacement.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const imgSrcPattern = new RegExp(`src="${escapedPattern}"`, "g");
            const svgHrefPattern = new RegExp(`href="${escapedPattern}"`, "g");
            
            if (html.match(imgSrcPattern)) {
              html = html.replace(imgSrcPattern, `src="${headshotDataUri}"`);
            } else if (html.match(svgHrefPattern)) {
              html = html.replace(svgHrefPattern, `href="${headshotDataUri}"`);
            }
          }
        }
      } else if (personField.replacements && Array.isArray(personField.replacements) && personField.type === "text") {
        // Handle text fields (name, role, talkTitle)
        const personValue = person[personField.name];
        if (personValue) {
          const patterns = personField.replacements.map(r => new RegExp(r.pattern));
          replaceFirst(patterns, personValue);
        }
      }
    }
  }

  return html;
}

// Main render function using config
export async function renderTemplateWithConfig(submission: Submission): Promise<string> {
  try {
    const templateFamily = submission.templateFamily;
    const templateVariant = submission.templateVariant;
    
    // Load config
    const config = await getTemplateConfig(templateFamily);
    if (!config) {
      throw new Error(`Template config not found for family: ${templateFamily}`);
    }

  // Extract variant number
  const variantNumber = templateVariant.split("-").pop() || "1";
  
  // Load template HTML - Priority 1: Database, Priority 2: Filesystem
  let html: string;
  
  try {
    // Try database first (for Figma imports and production)
    const template = await prisma.template.findUnique({
      where: { family: templateFamily },
    });
    
    if (template) {
      // Get HTML based on variant
      if (variantNumber === "1" && template.htmlContent) {
        html = template.htmlContent;
      } else if (variantNumber === "2" && template.htmlVariant2) {
        html = template.htmlVariant2;
      } else if (variantNumber === "3" && template.htmlVariant3) {
        html = template.htmlVariant3;
      } else {
        // Fall back to filesystem if variant not in database
        throw new Error(`Variant ${variantNumber} not found in database`);
      }
    } else {
      throw new Error(`Template ${templateFamily} not found in database`);
    }
  } catch (error) {
    // Fallback to filesystem (for existing templates and development)
    const templatePath = join(
      process.cwd(),
      "templates",
      templateFamily,
      `template-${variantNumber}.html`
    );
    
    if (!existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    html = await readFile(templatePath, "utf-8");
  }
  // Safely parse people and uploadUrls, defaulting to empty arrays if undefined/null/empty
  let people: any[] = [];
  let uploadUrls: string[] = [];
  try {
    if (submission.people && typeof submission.people === "string" && submission.people.trim() !== "") {
      people = JSON.parse(submission.people);
      if (!Array.isArray(people)) people = [];
    }
  } catch {
    people = [];
  }
  try {
    if (submission.uploadUrls && typeof submission.uploadUrls === "string" && submission.uploadUrls.trim() !== "") {
      const parsed = JSON.parse(submission.uploadUrls);
      // Handle new format: { headshots: [...], images: {...} }
      if (parsed.headshots && Array.isArray(parsed.headshots)) {
        uploadUrls = parsed.headshots;
      } else if (Array.isArray(parsed)) {
        // Legacy format: just an array
        uploadUrls = parsed;
      } else {
        uploadUrls = [];
      }
    }
  } catch {
    uploadUrls = [];
  }

    // Process assets
    try {
      const assetsDir = join(process.cwd(), "public", "assets");
      html = await processAssets(html, config, submission, assetsDir);
    } catch (error) {
      console.error("Error processing assets:", error);
      throw new Error(`Failed to process assets: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Process fonts
    try {
      html = await processFonts(html);
    } catch (error) {
      console.error("Error processing fonts:", error);
      throw new Error(`Failed to process fonts: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Process color replacements
    try {
      if (!submission.primaryColor) {
        throw new Error("primaryColor is missing from submission");
      }
      const lighterPrimaryColor = lightenColor(submission.primaryColor, 25);
      
      // Replace default color
      html = html.replace(/#3D9DFF/g, submission.primaryColor);
      
      // Replace any frame background colors with primaryColor
      // This handles frames that were generated with specific colors (like the month frame)
      // We'll replace common frame colors (red frames, etc.) with primaryColor
      // First, try to replace the specific color from the month frame if it exists
      html = html.replace(/#ff4e4e/gi, submission.primaryColor); // Common red frame color
      html = html.replace(/#FF4E4E/g, submission.primaryColor);
      
      // Also replace any color replacements from config
      if (config.colorReplacements) {
        for (const [color, fieldName] of Object.entries(config.colorReplacements)) {
          if (fieldName === "secondaryColor") {
            html = html.replace(new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), lighterPrimaryColor);
          } else if (fieldName === "primaryColor") {
            html = html.replace(new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), submission.primaryColor);
          }
        }
      }
    } catch (error) {
      console.error("Error processing color replacements:", error);
      throw new Error(`Failed to process color replacements: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Parse uploadUrls to get standalone image uploads
    let imageUploads: Record<string, string> = {};
    try {
      if (submission.uploadUrls && typeof submission.uploadUrls === "string" && submission.uploadUrls.trim() !== "") {
        const parsed = JSON.parse(submission.uploadUrls);
        if (parsed.images && typeof parsed.images === "object") {
          imageUploads = parsed.images;
        }
        // Also handle legacy format (array of headshots)
        if (Array.isArray(parsed) || (parsed.headshots && Array.isArray(parsed.headshots))) {
          // Legacy format, imageUploads stays empty
        }
      }
    } catch {
      // If parsing fails, imageUploads stays empty
    }

    // Process all fields
    if (config.fields && Array.isArray(config.fields)) {
      for (const field of config.fields) {
        try {
          if (field.type === "people") {
            html = processPeople(html, field, people, uploadUrls);
          } else if (field.type === "image" && field.name !== "headshot") {
            // Handle standalone image fields (logo, etc.)
            const imageUrl = imageUploads[field.name];
            if (imageUrl && field.replacements) {
              for (const replacement of field.replacements) {
                if (replacement.pattern) {
                  // Replace both src="..." and href="..." patterns for SVG
                  html = html.replace(new RegExp(`src="${replacement.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, "g"), `src="${imageUrl}"`);
                  html = html.replace(new RegExp(`href="${replacement.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, "g"), `href="${imageUrl}"`);
                  // Also replace just the placeholder text
                  html = html.replace(new RegExp(replacement.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), imageUrl);
                }
              }
            }
          } else {
            // Get value from submission
            // First try direct property (for backwards compatibility with eventTitle, etc.)
            let value = (submission as any)[field.name];
            
            // If not found, try reading from uploadUrls.fields (for dynamic fields)
            if (value === undefined || value === null) {
              try {
                if (submission.uploadUrls && typeof submission.uploadUrls === "string") {
                  const parsed = JSON.parse(submission.uploadUrls);
                  if (parsed.fields && parsed.fields[field.name] !== undefined) {
                    value = parsed.fields[field.name];
                    // If it's a date field and value is an ISO string, convert to Date
                    if (field.type === "date" && typeof value === "string") {
                      value = new Date(value);
                    }
                  }
                }
              } catch {
                // If parsing fails, value stays undefined
              }
            }
            
            // Process field even if value is undefined/null (for optional fields)
            // replaceField will handle missing values gracefully
            html = replaceField(html, field, value, submission);
          }
        } catch (error) {
          console.error(`Error processing field ${field.name}:`, error);
          console.error(`Field config:`, JSON.stringify(field, null, 2));
          console.error(`Field value:`, (submission as any)[field.name]);
          throw new Error(`Failed to process field "${field.name}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return html;
  } catch (error) {
    console.error("Error in renderTemplateWithConfig:", error);
    console.error("Submission data:", {
      id: submission.id,
      templateFamily: submission.templateFamily,
      templateVariant: submission.templateVariant,
      people: submission.people?.substring(0, 50),
      uploadUrls: submission.uploadUrls?.substring(0, 50),
    });
    throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

