import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

export async function GET() {
  try {
    // Fetch all quotes from Supabase
    const { data: quotes, error } = await supabase.from("quotes").select("*");

    if (error) {
      console.error("Error fetching quotes:", error);
      throw new Error("Error fetching quotes");
    }

    // Return all quotes
    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
