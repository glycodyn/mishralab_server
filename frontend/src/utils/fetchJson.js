export async function fetchPLDDTArray(jobId) {
    try{
  const plddtUrl = `${process.env.REACT_APP_API_URL}/confidence/${jobId}.json`;
  const res = await fetch(plddtUrl);
 if (!res.ok) {
      console.error(`Failed to fetch pLDDT data: ${res.status} ${res.statusText}`);
      if (res.status === 404) {
        throw new Error(`pLDDT data not found for job ${jobId}`);
      }
      throw new Error(`Failed to fetch pLDDT data: ${res.status} ${res.statusText}`);
    }
    
    const plddtData = await res.json();
    let arr = plddtData.atom_plddts || plddtData.plddt || plddtData.plddt_values || plddtData;
    
    if (!Array.isArray(arr)) {
      if (typeof arr === 'object' && arr !== null) {
        arr = Object.values(arr).map(Number);
      } else {
        console.error('Invalid pLDDT data format:', plddtData);
        throw new Error('Invalid pLDDT data format');
      }
    }
    
    return arr;
} catch (error) {
        console.error(`Error fetching pLDDT data for job ${jobId}:`, error);
        return [];
    }
}