/**
 * Wichita Micro-Market Intelligence Engine
 * Provides neighborhood-level architectural archetypes, price bands,
 * renovation considerations, and public data source integration specs for Wichita & Sedgwick County.
 */

export interface WichitaNeighborhoodProfile {
  id: string;
  name: string;
  quadrant: "East / Central" | "West / Central" | "North" | "South" | "East Metro";
  architecturalStyle: string;
  typicalYearBuilt: string;
  medianPriceRange: string;
  renovationCapCeiling: string;
  typicalScopeProfile: string;
  targetBuyerDemographic: string;
  investmentVelocity: "High / Fast Resale" | "Medium / Steady Demand" | "High Cashflow / High Yield";
  neighborhoodInsights: string;
}

export const WICHITA_NEIGHBORHOODS: WichitaNeighborhoodProfile[] = [
  {
    id: "college-hill",
    name: "College Hill",
    quadrant: "East / Central",
    architecturalStyle: "Craftsman Bungalows, Tudor Revival, Prairie Style",
    typicalYearBuilt: "1910 - 1940",
    medianPriceRange: "$180,000 - $350,000+",
    renovationCapCeiling: "$325,000 - $450,000 (Historic high-finish tier)",
    typicalScopeProfile: "Preserving cedar woodwork, architectural trim, lime/charcoal exterior contrast, modern kitchen open-concept conversions, copper/PEX plumbing upgrades.",
    targetBuyerDemographic: "Move-up professionals, young families, design-conscious owner-occupants.",
    investmentVelocity: "High / Fast Resale",
    neighborhoodInsights: "One of Wichita's most resilient historic equity corridors. Buyers pay a premium for preserved character paired with modern mechanical and kitchen infrastructure."
  },
  {
    id: "crown-heights",
    name: "Crown Heights",
    quadrant: "East / Central",
    architecturalStyle: "Mid-Century Brick Ranches, Minimalist Traditional",
    typicalYearBuilt: "1948 - 1970",
    medianPriceRange: "$200,000 - $320,000",
    renovationCapCeiling: "$300,000 - $375,000",
    typicalScopeProfile: "Brick limewashing, modern vertical slat cedar accents, frosted glass garage doors, primary suite additions, master bath expansions.",
    targetBuyerDemographic: "Relocating professionals, medical staff (close to Wesley Medical), turnkey buyers.",
    investmentVelocity: "High / Fast Resale",
    neighborhoodInsights: "Highly sought after for solid masonry construction, mature tree canopies, and rapid absorption of renovated mid-century aesthetics."
  },
  {
    id: "delano",
    name: "Delano District",
    quadrant: "West / Central",
    architecturalStyle: "Victorian Cottages, Shotgun Homes, Folk Vernacular",
    typicalYearBuilt: "1900 - 1935",
    medianPriceRange: "$120,000 - $220,000",
    renovationCapCeiling: "$210,000 - $265,000",
    typicalScopeProfile: "Full mechanical replacements (HVAC/Electrical), foundation piering assessment, modern urban exterior paint palettes, rental/Airbnb finish packages.",
    targetBuyerDemographic: "First-time homebuyers, riverfront / ballpark workers, short/mid-term rental operators.",
    investmentVelocity: "High / Fast Resale",
    neighborhoodInsights: "Adjacent to Riverfront Stadium and downtown nightlife. Strong appreciation tailwinds and exceptional rental demand."
  },
  {
    id: "riverside",
    name: "Riverside",
    quadrant: "West / Central",
    architecturalStyle: "Queen Anne, Craftsman, Spanish Colonial Revival, Mid-Century",
    typicalYearBuilt: "1905 - 1955",
    medianPriceRange: "$150,000 - $290,000",
    renovationCapCeiling: "$275,000 - $360,000",
    typicalScopeProfile: "Porch restorations, hardwood floor refinishing, energy-efficient window replacements, flood zone elevation checks (Little Arkansas River proximity).",
    targetBuyerDemographic: "Creatives, aviation engineers, park and museum enthusiasts.",
    investmentVelocity: "High / Fast Resale",
    neighborhoodInsights: "Wichita's cultural and park-centric enclave. High walkability demand and rapid community engagement."
  },
  {
    id: "south-city",
    name: "South City / Benjamin Hills / Planeview Area",
    quadrant: "South",
    architecturalStyle: "Post-War 2-3 Bedroom Ranches, Frame Cottages",
    typicalYearBuilt: "1945 - 1975",
    medianPriceRange: "$80,000 - $145,000",
    renovationCapCeiling: "$135,000 - $175,000",
    typicalScopeProfile: "Durable rental turnarounds: Luxury Vinyl Plank (LVP), quartz/granite counters, updated mechanicals, low-maintenance landscape packages.",
    targetBuyerDemographic: "BRRRR investors, Section 8 / long-term rental landlords, affordable housing buyers.",
    investmentVelocity: "High Cashflow / High Yield",
    neighborhoodInsights: "The backbone of Wichita cash-flow investing. High rent-to-price ratios ideal for BRRRR execution and DSCR portfolio scaling."
  }
];

export function queryWichitaNeighborhood(queryText: string): WichitaNeighborhoodProfile | null {
  const q = queryText.toLowerCase();
  for (const n of WICHITA_NEIGHBORHOODS) {
    if (q.includes(n.id) || q.includes(n.name.toLowerCase())) {
      return n;
    }
  }
  return null;
}

/**
 * Public Data Source Integration Specification Plan
 * Maps how G & VICTOR integrate with external public APIs in Wichita & Sedgwick County.
 */
export const WICHITA_DATA_SOURCE_SPEC = {
  countyAssessor: {
    name: "Sedgwick County Property Tax & Appraisal System (MAB)",
    endpoint: "https://www.sedgwickcounty.org/assessor/property-search/",
    integrationMethod: "REST/Scraper via Parcel ID / PIN",
    fieldsExtracted: ["Assessed Value", "Prior Sale Date", "Tax Exempt Status", "Delinquent Tax Status", "Square Footage", "Year Built", "Legal Description"]
  },
  gisParcels: {
    name: "Sedgwick County GIS Parcel Map Service",
    endpoint: "https://gismaps.sedgwickcounty.org/arcgis/rest/services/Cadastral/Parcels/MapServer",
    integrationMethod: "ArcGIS REST API",
    fieldsExtracted: ["Zoning Code", "Flood Plain Risk", "Lot Dimensions", "Owner Record Name"]
  },
  mlsComparables: {
    name: "South Central Kansas MLS (SCKMLS / Bridge Interactive)",
    integrationMethod: "RESO Web API (OAuth 2.0)",
    fieldsExtracted: ["Closed Price", "Days on Market (DOM)", "Original List Price", "Price Per SqFt", "Photo Metadata"]
  }
};
