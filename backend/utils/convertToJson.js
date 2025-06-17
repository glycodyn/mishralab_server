const path = require('path');
const fs = require('fs');


function convertToAlphafoldJson(data, filename = 'target_1') {
    function getChainId(index) {
    let id = '';
    while (index >= 0) {
      id = String.fromCharCode(65 + (index % 26)) + id;
      index = Math.floor(index / 26) - 1;
    }
    return id;
  }

   function getChainType(seq) {
    const s = seq.toUpperCase();
    if (/^[ACGT]+$/.test(s)) return 'dna';
    if (/^[ACGU]+$/.test(s)) return 'rna';
    return 'protein';
  }

 const entries = [];
  let currentHeader = null;
  let currentSeq = [];
  const lines = data.trim().split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('>')) {
      if (currentHeader) {
        entries.push({ header: currentHeader, sequence: currentSeq.join('') });
      }
      currentHeader = line.substring(1).trim();
      currentSeq = [];
    } else {
      currentSeq.push(line.trim());
    }
  }
  if (currentHeader) {
    entries.push({ header: currentHeader, sequence: currentSeq.join('') });
  }

  if (entries.length === 0) {
    
    
    const seq = data.trim().replace(/\s+/g, '').toUpperCase();
    if (!seq) throw new Error('No sequence found in file.');
    entries.push({ header: filename, sequence: seq });
  }

  //json file
  const sequences = entries.map((entry, idx) => {
    const seq = entry.sequence.replace(/\s+/g, '').toUpperCase();
    if (!seq) throw new Error('No sequence found for chain.');
    if (!/^[A-Za-z]+$/.test(seq)) {
      throw new Error('Sequence contains invalid characters. Only letters are allowed.');
    }
    const id = getChainId(idx);
    const type = getChainType(seq);
    if (type === 'protein') {
      return {
        protein: {
          id,
          sequence: seq
        
        }
      };
    } else if (type === 'dna') {
      return {
        dna: {
          id,
          sequence: seq
         
        }
      };
    } else if (type === 'rna') {
      return {
        rna: {
          id,
          sequence: seq
         
        }
      };
    }
  });
  return {
    name: path.parse(filename).name,
    sequences,
    modelSeeds: [1,2],
    dialect: "alphafold3",
    version: 3
    
  };
}

module.exports = convertToAlphafoldJson;