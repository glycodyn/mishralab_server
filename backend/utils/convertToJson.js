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

  const sequences = [];
    let chainIdx = 0;
    for (const entry of entries) {
        // Split by colon, remove empty, trim, and uppercase
        const chains = entry.sequence.split(':').map(s => s.replace(/\s+/g, '').toUpperCase()).filter(Boolean);
        for (const chainSeq of chains) {
            if (!chainSeq) continue;
            if (!/^[A-Za-z]+$/.test(chainSeq)) {
                throw new Error('Sequence contains invalid characters. Only letters are allowed.');
            }
            const id = getChainId(chainIdx++);
            const type = getChainType(chainSeq);
            if (type === 'protein') {
                sequences.push({
                    protein: {
                        id,
                        sequence: chainSeq
                    }
                });
            } else if (type === 'dna') {
                sequences.push({
                    dna: {
                        id,
                        sequence: chainSeq
                    }
                });
            } else if (type === 'rna') {
                sequences.push({
                    rna: {
                        id,
                        sequence: chainSeq
                    }
                });
            }
        }
    }
  return {
    name: path.parse(filename).name,
    sequences,
    modelSeeds: [1],
    dialect: "alphafold3",
    version: 3
    
  };
}

module.exports = convertToAlphafoldJson;