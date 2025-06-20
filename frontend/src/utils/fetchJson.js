export async function fetchPLDDTArray(jobId) {
  const plddtUrl = `${process.env.REACT_APP_API_URL}/confidence/${jobId}.json`;
  const res = await fetch(plddtUrl);
  if (!res.ok) throw new Error(`Failed to fetch pLDDT data from ${plddtUrl}`);
  const plddtData = await res.json();
  let arr = plddtData.atom_plddts || plddtData.plddt || plddtData.plddt_values || plddtData;
  if (!Array.isArray(arr)) arr = Object.values(arr).map(Number);
  return arr;
}