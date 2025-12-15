import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_API_KEY = process.env.GEOLOCATION_API;

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

function extractPlaceName(
  addressComponents: AddressComponent[],
  formattedAddress: string
): string {
  if (!addressComponents || addressComponents.length === 0) {
    return formattedAddress;
  }

  const neighborhood = addressComponents.find(
    (c) => c.types.includes("neighborhood") || c.types.includes("sublocality")
  );
  const locality = addressComponents.find((c) => c.types.includes("locality"));
  const adminArea = addressComponents.find(
    (c) =>
      c.types.includes("administrative_area_level_1") ||
      c.types.includes("administrative_area_level_2")
  );

  const parts: string[] = [];
  if (neighborhood) parts.push(neighborhood.long_name);
  if (locality) parts.push(locality.long_name);
  if (adminArea && !locality) parts.push(adminArea.long_name);

  return parts.length > 0 ? parts.join(", ") : formattedAddress;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing latitude or longitude" },
      { status: 400 }
    );
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "Google Places API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}&language=en`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      const message =
        data.status === "ZERO_RESULTS" ? "No address found" : data.status;
      return NextResponse.json(
        { success: false, place_name: null, formatted_address: null, message },
        { status: 200 }
      );
    }

    const result = data.results[0];
    const formattedAddress = result.formatted_address;
    const placeName = extractPlaceName(
      result.address_components,
      formattedAddress
    );

    return NextResponse.json({
      success: true,
      place_name: placeName,
      formatted_address: formattedAddress,
      place_id: result.place_id,
    });
  } catch (error: any) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to geocode location" },
      { status: 500 }
    );
  }
}
