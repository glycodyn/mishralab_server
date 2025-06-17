export async function fetchPLDDTArray(jobId) {
  const plddtUrl = `http://172.25.15.192:5000/confidence/${jobId}.json`;
  const res = await fetch(plddtUrl);
  if (!res.ok) throw new Error(`Failed to fetch pLDDT data from ${plddtUrl}`);
  const plddtData = await res.json();
  // Always convert to array
  let arr = plddtData.atom_plddts || plddtData.plddt || plddtData.plddt_values || plddtData;
  if (!Array.isArray(arr)) arr = Object.values(arr).map(Number);
  return arr;
}