# Sedgwick Parcel Provider — Source and Use Controls

**Implementation:** `server/services/sedgwickParcelProvider.ts`
**Provider:** City of Wichita GIS, `COWGIS/Property_and_Location/MapServer/4`
**Data scope:** one exact address supplied by the seller; parcel and appraiser attributes only.

## Source evidence

The public City of Wichita GIS layer identifies parcel PIN, situs address, city, ZIP, tax unit, land/improvement/total appraised values, year built, living area, bedrooms, bathrooms, legal description, and property-use description. The layer's public metadata exposes these fields and supports query operations. The county's own GIS data-layers page describes its countywide property-parcel layer as approximately 220,000 records with weekly updates. The city layer's attribute-refresh timestamp is not exposed by the adapter, so the application records retrieval time only and does not claim a source-update date.

## Use restrictions and implementation boundaries

- The adapter makes one exact, seller-submitted address query. It does not enumerate, export, or retain address/owner lists.
- Owner names and owner mailing addresses are deliberately excluded from `outFields`, response contracts, logs, and caches.
- No data is used to initiate unsolicited outreach. The request is initiated by the person submitting the property.
- The County Appraiser's public-record certification prohibits using lists of names/addresses derived from Appraiser records to offer property or services to listed people/residents. The property-tax portal separately requires a certification under K.S.A. 45-220.
- County real-property sales information has a separate authorization process under K.S.A. 79-1437f. This adapter does not query sales records or claim access to comparable sales.
- Appraised values are tax-appraisal facts, not market value, ARV, a comp, or a purchase offer.
- Parcel facts do not establish condition, ownership authority, title, zoning, flood status, taxes due, or legal access unless a separate source explicitly provides that field.
- Multiple parcels returned for one address produce an `ambiguous` result. The system does not choose one automatically.
- Provider outage, unsupported location, invalid address, and no match remain distinct states.

## Activation

Production use is fail-closed unless `OCGICT_SEDGWICK_GIS_ENABLED=true` is set on the Cloud Run service. The code change does not set this variable or change production. The flag remains off until OCG approves the source-use interpretation and the staging acceptance battery passes.

## Underwriting boundary

The comparable-sales provider remains disconnected. No automated seller offer is available without separately licensed, verified closed-sale evidence and an evidenced repair scope. When those inputs are absent, the existing underwriting engine must return human review. No synthetic comps, ARV, rent, condition, or repair costs may be inferred from parcel fields.
