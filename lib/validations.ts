import { z } from "zod";

export const linkedinFormSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  peopleCount: z.enum(["1", "2", "3"]),
  scale: z.enum(["1", "2", "3"]),
  format: z.enum(["png", "jpg", "webp", "pdf"]),
  eventTitle: z.string().min(1, "Required").max(60, "Max 60 characters").trim(),
  venueName: z.string().min(1, "Required").max(60, "Max 60 characters").trim(),
  addressLine: z.string().min(1, "Required").max(80, "Max 80 characters").trim(),
  cityLine: z.string().min(1, "Required").max(40, "Max 40 characters").trim(),
  eventDate: z.date({
    required_error: "Event date is required",
  }),
  people: z.array(
    z.object({
      name: z.string().min(1, "Required").max(40, "Max 40 characters").trim(),
      role: z.string().min(1, "Required").max(60, "Max 60 characters").trim(),
      talkTitle: z.string().min(1, "Required").max(120, "Max 120 characters").trim(),
      headshot: z.instanceof(File, { message: "Headshot is required" }).refine(
        (file) => file.size <= 10 * 1024 * 1024,
        "File size must be less than 10MB"
      ).refine(
        (file) => ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type),
        "Only PNG, JPG, and WebP images are allowed"
      ),
    })
  ).min(1).max(3),
}).refine(
  (data) => data.people.length === parseInt(data.peopleCount),
  {
    message: "Number of people must match people count selection",
    path: ["people"],
  }
);

export type LinkedinFormData = z.infer<typeof linkedinFormSchema>;

