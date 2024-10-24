import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function GET(request: Request) {
  // Step 1: Extract the random query parameter from the URL to ensure uniqueness for each request
  const url = new URL(request.url);
  const randomParam =
    url.searchParams.get("random") || Math.random().toString();
  console.log("Random parameter for uniqueness:", randomParam);

  try {
    // Step 2: Log environment variables for debugging (usually only for development, not recommended for production)
    console.log("Environment Variables in Production:");
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "Supabase Anon Key:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Step 3: Fetch all quotes from Supabase
    const { data: quotes, error } = await supabase.from("quotes").select("*");

    // Step 4: Handle errors that occur while fetching data
    if (error) {
      console.error("Error fetching quotes from Supabase:", error);
      throw new Error("Error fetching quotes from Supabase");
    }

    console.log("Fetched quotes:", quotes); // Log the fetched quotes (for debugging)

    // Step 5: Pick a random quote if the fetched data is not empty
    if (quotes && quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const randomQuote = quotes[randomIndex];
      console.log("Selected quote:", randomQuote); // Log the selected random quote

      // Step 6: Create response with minimal cache headers to prevent caching
      const response = NextResponse.json(randomQuote);
      response.headers.set("Cache-Control", "no-store"); // Ensure the response is not cached
      return response;
    } else {
      // Step 7: If no quotes are available, return a 404 response with a message
      console.warn("No quotes available in Supabase");
      return NextResponse.json(
        { message: "No quotes available" },
        { status: 404 }
      );
    }
  } catch (error) {
    // Step 8: Handle any errors that occur during the process and return a 500 response
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
