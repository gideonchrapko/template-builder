/**
 * Figma Import API - MVP for Phase 3
 * Accepts Figma export data and generates template files
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateTemplateFromFigma } from "@/lib/figma-template-generator";
import { FigmaExport } from "@/lib/figma-import-types";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email || !session.user.email.endsWith("@botpress.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate Figma export structure
    if (!body.name || !body.width || !body.height || !Array.isArray(body.nodes)) {
      return NextResponse.json(
        { error: "Invalid Figma export format. Required: name, width, height, nodes[]" },
        { status: 400 }
      );
    }

    const figmaExport: FigmaExport = {
      name: body.name,
      width: body.width,
      height: body.height,
      nodes: body.nodes,
      images: body.images || {}
    };

    // Generate template files
    const result = await generateTemplateFromFigma(figmaExport);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("Figma import error:", error);
    return NextResponse.json(
      { 
        error: "Failed to import Figma template",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
