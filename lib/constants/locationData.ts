// Kenya Regions (Former Provinces) with their constituent counties
export const KENYA_REGIONS = {
  "Central": ["Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu"],
  "Coast": ["Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta"],
  "North Eastern": ["Garissa", "Wajir", "Mandera"],
  "Eastern": [
    "Marsabit",
    "Isiolo",
    "Meru",
    "Tharaka Nithi",
    "Embu",
    "Kitui",
    "Machakos",
    "Makueni",
  ],
  "Rift Valley": [
    "Turkana",
    "West Pokot",
    "Samburu",
    "Trans Nzoia",
    "Uasin Gishu",
    "Elgeyo Marakwet",
    "Nandi",
    "Baringo",
    "Laikipia",
    "Nakuru",
    "Narok",
    "Kajiado",
    "Kericho",
    "Bomet",
  ],
  "Western": ["Kakamega", "Vihiga", "Bungoma", "Busia"],
  "Nyanza": ["Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira"],
  "Nairobi": ["Nairobi"],
} as const;

export const KENYA_REGION_NAMES = Object.keys(KENYA_REGIONS) as KenyaRegion[];

export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita Taveta",
  "Tana River",
  "Tharaka Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

export const CUSTOMER_TYPES = [
  "website",
  "socials",
  "expo",
  "walk in",
  "cold call",
  "prospect",
  "agent",
  "technician",
  "referal",
  "online",
] as const;

export type KenyaRegion = keyof typeof KENYA_REGIONS;
export type KenyaCounty = (typeof KENYA_COUNTIES)[number];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

// Helper function to get counties for a specific region
export function getCountiesForRegion(region: KenyaRegion): readonly string[] {
  return KENYA_REGIONS[region] || [];
}

// Helper function to get region for a specific county
export function getRegionForCounty(county: string): KenyaRegion | null {
  for (const [region, counties] of Object.entries(KENYA_REGIONS)) {
    if ((counties as readonly string[]).includes(county)) {
      return region as KenyaRegion;
    }
  }
  return null;
}
