const express = require('express');
const router = express.Router();
const axios = require('axios');


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
let cacheResults = [];
let cacheIds = []



router.get('/get', async (req, res) => {
//     try {
//    const query = {
//  "query": {
//    "type": "terminal",
//    "service": "text",
//    "parameters": {
//      "attribute": "rcsb_nonpolymer_instance_annotation.comp_id",
//      "operator": "in",
//      "value": ["NAG", "MAN", "BMA", "FUC", "GAL", "GLC"]
//    }
//  },
//  "return_type": "non_polymer_entity"
//}
//  
//
//  const encodedQuery = encodeURIComponent(JSON.stringify(query));
//  console.log("Encoded Query: ", encodedQuery);
if (cacheResults.length == 0) {
   const offset = Number(req.query.offset) || 0;

    const listResp = await axios.get(
      `https://api.glytoucan.org/glycans/list/?payload=id1&limit=100&${offset}`,
    );
    console.log("Full response:", JSON.stringify(listResp.data, null, 2));

    const ids = listResp.data.items;
    cacheIds = ids;
    const results = [];

    for (const id of ids) {
        
        try{
            const detailUrl = `${process.env.GLYGEN_URL}/detail/${id}/`;
            const detailResp = await axios.get(detailUrl);
            console.log(`Fetched details for ${id}:`, detailResp.data);
            
            const name = detailResp.data?.glytoucan?.glytoucan_ac 
                         
            const smiles = detailResp.data?.smiles_isomeric 
        

        if (smiles&&name) {
          results.push({ name, smiles });
        }
      } catch (e) {
        console.warn(`Failed to fetch details for ${id}: ${e.message}`);
      }
    }
    cacheResults = results;
    console.log("Results:", results);

    res.json(cacheResults)
    console.log("Cache Results:", cacheResults);
}else{
    res.json(cacheResults)
}

  })
  
  router.get('/smiles/:ac', async (req, res) => {
    const ac = req.params.ac;
    try {
        const detailUrl = `https://api.glygen.org/glycan/detail/${ac}/`;
        const detailResp = await axios.get(detailUrl);
        const name = detailResp.data?.glytoucan?.glytoucan_ac;
        const smiles = detailResp.data?.smiles_isomeric || null;
        if (name && smiles) {
            res.json({ name, smiles });
        } else {
            res.status(404).json({ error: "SMILES not found for this accession." });
        }
    } catch (e) {
        res.status(404).json({ error: "Accession not found or API error." });
    }
});

router.get('/image/:ac', async (req, res) => {
    const ac = req.params.ac;
    try{
        console.log(`Fetching image for ${ac}`);
        const imageUrl = `${process.env.GLYGEN_URL}/image/${ac}/`;
        const imageResp = await axios.get(imageUrl, {responseType: 'stream'})
            res.setHeader('Content-Type', 'image/png');
             res.set('Access-Control-Allow-Origin', '*');
            imageResp.data.pipe(res);
    }catch (e) {
        console.error(`Error fetching image for ${ac}:`, e.message);
        res.status(404).send("Image not found or API error." );
    }
});


module.exports = router;