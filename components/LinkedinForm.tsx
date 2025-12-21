"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { linkedinFormSchema, type LinkedinFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/DatePicker";
import { lightenColor } from "@/lib/utils";

export default function LinkedinForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LinkedinFormData>({
    resolver: zodResolver(linkedinFormSchema),
    defaultValues: {
      primaryColor: "#3D9DFF",
      peopleCount: "1",
      scale: "1",
      format: "png",
      people: [{ name: "", role: "", talkTitle: "", headshot: undefined as any }],
    },
  });

  const peopleCount = watch("peopleCount");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "people",
  });

  // Sync fields array with peopleCount
  const currentPeopleCount = parseInt(peopleCount || "1");
  if (fields.length < currentPeopleCount) {
    for (let i = fields.length; i < currentPeopleCount; i++) {
      append({ name: "", role: "", talkTitle: "", headshot: undefined as any });
    }
  } else if (fields.length > currentPeopleCount) {
    for (let i = fields.length; i > currentPeopleCount; i--) {
      remove(i - 1);
    }
  }

  const onSubmit = async (data: LinkedinFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("primaryColor", data.primaryColor);
      formData.append("peopleCount", data.peopleCount);
      formData.append("scale", data.scale);
      formData.append("format", data.format);
      formData.append("eventTitle", data.eventTitle);
      formData.append("venueName", data.venueName);
      formData.append("addressLine", data.addressLine);
      formData.append("cityLine", data.cityLine);
      formData.append("eventDate", data.eventDate.toISOString());

      // Append headshots
      data.people.forEach((person, index) => {
        formData.append(`headshot_${index}`, person.headshot);
        formData.append(`person_${index}_name`, person.name);
        formData.append(`person_${index}_role`, person.role);
        formData.append(`person_${index}_talkTitle`, person.talkTitle);
      });

      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const result = await response.json();
      router.push(`/results/${result.submissionId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Color Section */}
      <Card>
        <CardHeader>
          <CardTitle>Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-4 items-center mt-2">
              <Input
                id="primaryColor"
                type="color"
                {...register("primaryColor")}
                className="w-24 h-10"
              />
              <Input
                type="text"
                {...register("primaryColor")}
                placeholder="#3D9DFF"
                className="flex-1"
              />
            </div>
            {errors.primaryColor && (
              <p className="text-sm text-destructive mt-1">
                {errors.primaryColor.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* People Count & Output Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="peopleCount">Number of People</Label>
            <Select
              value={watch("peopleCount")}
              onValueChange={(value) => setValue("peopleCount", value as "1" | "2" | "3")}
            >
              <SelectTrigger id="peopleCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Person</SelectItem>
                <SelectItem value="2">2 People</SelectItem>
                <SelectItem value="3">3 People</SelectItem>
              </SelectContent>
            </Select>
            {errors.peopleCount && (
              <p className="text-sm text-destructive mt-1">
                {errors.peopleCount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="scale">Poster Scale</Label>
            <Select
              value={watch("scale")}
              onValueChange={(value) => setValue("scale", value as "1" | "2" | "3")}
            >
              <SelectTrigger id="scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="3">3x</SelectItem>
              </SelectContent>
            </Select>
            {errors.scale && (
              <p className="text-sm text-destructive mt-1">
                {errors.scale.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="format">Output Format</Label>
            <Select
              value={watch("format")}
              onValueChange={(value) => setValue("format", value as "png" | "jpg" | "webp" | "pdf")}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            {errors.format && (
              <p className="text-sm text-destructive mt-1">
                {errors.format.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="eventTitle">Event Title</Label>
            <Input
              id="eventTitle"
              {...register("eventTitle")}
              placeholder="Code @ Quebec"
              maxLength={60}
            />
            {errors.eventTitle && (
              <p className="text-sm text-destructive mt-1">
                {errors.eventTitle.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="venueName">Venue Name</Label>
            <Input
              id="venueName"
              {...register("venueName")}
              placeholder="Botpress HQ"
              maxLength={60}
            />
            {errors.venueName && (
              <p className="text-sm text-destructive mt-1">
                {errors.venueName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="addressLine">Address</Label>
            <Input
              id="addressLine"
              {...register("addressLine")}
              placeholder="400 Blvd. De Maisonneuve Ouest"
              maxLength={80}
            />
            {errors.addressLine && (
              <p className="text-sm text-destructive mt-1">
                {errors.addressLine.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cityLine">City & Postal Code</Label>
            <Input
              id="cityLine"
              {...register("cityLine")}
              placeholder="Montreal, QC  H3A 1L4"
              maxLength={40}
            />
            {errors.cityLine && (
              <p className="text-sm text-destructive mt-1">
                {errors.cityLine.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="eventDate">Event Date</Label>
            <DatePicker
              value={watch("eventDate")}
              onChange={(date) => setValue("eventDate", date!)}
              error={errors.eventDate?.message}
            />
            {errors.eventDate && (
              <p className="text-sm text-destructive mt-1">
                {errors.eventDate.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* People Blocks */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
              <CardTitle>Person {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`people.${index}.name`}>Name</Label>
                <Input
                  id={`people.${index}.name`}
                  {...register(`people.${index}.name`)}
                  placeholder="John Doe"
                  maxLength={40}
                />
                {errors.people?.[index]?.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.people[index]?.name?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`people.${index}.role`}>Role</Label>
                <Input
                  id={`people.${index}.role`}
                  {...register(`people.${index}.role`)}
                  placeholder="CTO @ Botpress"
                  maxLength={60}
                />
                {errors.people?.[index]?.role && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.people[index]?.role?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`people.${index}.talkTitle`}>Talk Title</Label>
                <Input
                  id={`people.${index}.talkTitle`}
                  {...register(`people.${index}.talkTitle`)}
                  placeholder="Kubernetes the right way: A platform engineering approach to K8s"
                  maxLength={120}
                />
                {errors.people?.[index]?.talkTitle && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.people[index]?.talkTitle?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`people.${index}.headshot`}>Headshot</Label>
                <Input
                  id={`people.${index}.headshot`}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue(`people.${index}.headshot`, file, { shouldValidate: true });
                    }
                  }}
                />
                {errors.people?.[index]?.headshot && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.people[index]?.headshot?.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Generating..." : "Generate Poster"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/templates")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

