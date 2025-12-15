"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface CoordinatesDisplayProps {
  latitude: string;
  longitude: string;
}

export function CoordinatesDisplay({
  latitude,
  longitude,
}: Readonly<CoordinatesDisplayProps>) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAddress = async () => {
      if (!latitude || !longitude) return;

      setLoading(true);
      setError(false);
      try {
        // Using OpenStreetMap Nominatim API
        // Note: In a production environment with high volume, you should use a paid geocoding service
        // or host your own Nominatim instance.
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "UMS_POS_Client/1.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            if (data.display_name) {
              // Clean up the address a bit if needed, or just use display_name
              setAddress(data.display_name);
            } else {
              setError(true);
            }
          }
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error("Error reverse geocoding:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAddress();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <span className='text-xs text-gray-500 flex items-center gap-1'>
        <Loader2 className='h-3 w-3 animate-spin' />
        Resolving location...
      </span>
    );
  }

  if (error || !address) {
    return (
      <span className='text-sm text-gray-600'>
        {latitude}, {longitude}
      </span>
    );
  }

  return (
    <span className='text-sm text-gray-700' title={`${latitude}, ${longitude}`}>
      {address}
    </span>
  );
}
