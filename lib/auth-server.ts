import { headers } from "next/headers";
import { getAuth } from "./auth";

export async function getServerSession() {
  // headers() first: it marks the route dynamic before auth config is read,
  // so prerendering never needs auth secrets.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}
