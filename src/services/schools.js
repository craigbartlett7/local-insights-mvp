// GIAS + Ofsted datasets (bulk / endpoints).
// For MVP, show nearest 3 schools placeholder.
export async function getSchoolsSummary(geo) {
  return {
    nearest: [
      { name: "St Mary's Primary", ofsted: "Outstanding", distanceKm: 0.6 },
      { name: "Town Secondary", ofsted: "Good", distanceKm: 1.1 },
      { name: "Riverside Academy", ofsted: "Good", distanceKm: 1.4 }
    ],
    note: "Demo placeholder; Sprint 1 will wire to GIAS/Ofsted data download/API."
  };
}
