export async function getSchoolsSummary(geo) {
  return {
    nearest: [
      { name: "St Mary's Primary", ofsted: "Outstanding", distanceKm: 0.6 },
      { name: "Town Secondary", ofsted: "Good", distanceKm: 1.1 },
      { name: "Riverside Academy", ofsted: "Good", distanceKm: 1.4 }
    ],
    note: "Demo placeholder; connect to GIAS/Ofsted feed in Sprint 2."
  };
}
