import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (error: any) {
    console.error("Auth GET error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Configuration error", 
        message: error?.message,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (error: any) {
    console.error("Auth POST error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Configuration error", 
        message: error?.message,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

