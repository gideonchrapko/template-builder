import { readFile } from "fs/promises";
import { join } from "path";
import { format } from "date-fns";
import { Submission } from "@prisma/client";

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1350;

export function getPosterDimensions(scale: number) {
  return {
    width: BASE_WIDTH * scale,
    height: BASE_HEIGHT * scale,
  };
}

export async function renderTemplate(submission: Submission): Promise<string> {
  const templateVariant = submission.templateVariant;
  const templatePath = join(
    process.cwd(),
    "..",
    "41-mtl-code",
    "templates",
    "templates",
    `${templateVariant}.html`
  );

  let html = await readFile(templatePath, "utf-8");
  const people = JSON.parse(submission.people);
  const uploadUrls = JSON.parse(submission.uploadUrls);

  // Format date
  const formattedDate = format(new Date(submission.eventDate), "EEEE, MMMM d");

  // Replace placeholders in template
  // This is a simplified version - you'll need to adapt based on your actual template structure
  html = html.replace(/#F4F4F4/g, submission.secondaryColor);
  html = html.replace(/#3D9DFF/g, submission.primaryColor);
  html = html.replace(/#B5DAFF/g, submission.secondaryColor);

  // Replace event title
  html = html.replace(/Placeholder Text/g, submission.eventTitle);

  // Replace date
  html = html.replace(/Thursday, November 20/g, formattedDate);

  // Replace venue information
  html = html.replace(/400 Blvd. De Maisonneuve Ouest/g, submission.addressLine);
  html = html.replace(/Montreal, QC  H3A 1L4/g, submission.cityLine);
  html = html.replace(/Doors open @ 6:00PM/g, `Doors open @ ${format(new Date(submission.eventDate), "h:mm a")}`);

  // Replace people information
  people.forEach((person: any, index: number) => {
    // Replace name and role (appears in multiple places)
    const nameRolePattern = new RegExp(`John Doe`, "g");
    html = html.replace(nameRolePattern, person.name);
    
    const rolePattern = new RegExp(`Graphic Designer @ Botpress`, "g");
    html = html.replace(rolePattern, person.role);

    // Replace talk title
    const talkTitlePattern = new RegExp(`Lorem Ipsum Dolor Sit`, "g");
    html = html.replace(talkTitlePattern, person.talkTitle);

    // Replace headshot image
    const headshotPattern = new RegExp(`assets/speaker-photo.png`, "g");
    // Only replace the first occurrence for each person
    if (index === 0) {
      html = html.replace(headshotPattern, person.headshotUrl);
    } else {
      // For subsequent people, we need to be more specific
      // This is a simplified approach - you may need to adjust based on template structure
      html = html.replace(`speaker-photo.png`, person.headshotUrl);
    }
  });

  // Inject CSS variables for colors
  const styleTag = `
    <style>
      :root {
        --primary: ${submission.primaryColor};
        --secondary: ${submission.secondaryColor};
      }
    </style>
  `;
  html = html.replace("</head>", `${styleTag}</head>`);

  return html;
}

