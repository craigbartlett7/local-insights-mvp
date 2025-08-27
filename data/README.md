# Income dataset (optional)

To enable the **Income (5 km)** panel:
1. Download ONS *Small area model-based income estimates* for MSOAs (England & Wales).
2. Create a CSV at `data/msoa_income.csv` with columns:
```
msoa,lat,lng,median_household_income
E02000001,53.483,-2.237,32500
...
```
- `lat,lng` should be WGS84 centroid of the MSOA.
- `median_household_income` in GBP/year.

The app will compute the average of all MSOA centroids within 5 km of the selected location.
