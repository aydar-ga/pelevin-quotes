import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

// Define the type for a quote object
type Quote = {
  id: string;
  text: string;
  book: string;
};

// Helper function to shuffle array (Fisher-Yates Algorithm)
function shuffleArray(array: Quote[]): Quote[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

    // Pick a random quote using a shuffle to ensure better randomness
    if (quotes && quotes.length > 0) {
      // Cast the data to an array of Quote objects
      const shuffledQuotes = shuffleArray(quotes as Quote[]);
      const randomQuote = shuffledQuotes[0];
      console.log("Selected quote:", randomQuote);

      // Create response with no-cache headers
      const response = NextResponse.json(randomQuote);
      response.headers.set(
        "Cache-Control",
        "no-store, max-age=0, must-revalidate, proxy-revalidate"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
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
