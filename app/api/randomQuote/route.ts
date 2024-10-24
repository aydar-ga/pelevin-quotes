import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

// Define the type for a quote object
type Quote = {
  id: string;
  text: string;
  book: string;
};

export async function GET(request: Request) {
  // Extract the random query parameter from the URL (for uniqueness)
  const url = new URL(request.url);
  const randomParam =
    url.searchParams.get("random") || Math.random().toString();

  // Logging the random parameter to ensure it's not unused
  console.log("Random parameter for uniqueness:", randomParam);

  try {
    console.log("Environment Variables in Production:");
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "Supabase Anon Key:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch all quotes from Supabase
    const { data: quotes, error } = await supabase.from("quotes").select("*");

    if (error) {
      console.error("Error fetching quotes from Supabase:", error);
      throw new Error("Error fetching quotes from Supabase");
    }

    console.log("Fetched quotes:", quotes); // Log the quotes fetched

    // Pick a random quote directly from the fetched data
    if (quotes && quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const randomQuote = quotes[randomIndex];
      console.log("Selected quote:", randomQuote);

      // Create response without complex cache headers
      const response = NextResponse.json(randomQuote);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } else {
      console.warn("No quotes available in Supabase");
      return NextResponse.json(
        { message: "No quotes available" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
