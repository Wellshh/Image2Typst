// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data'); 
const { tex2typst } = require('tex2typst');
const fetch = require('node-fetch'); 

const app = express();
const port = 3000;

// --- Middleware ---
app.use(express.static('public'));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- API Endpoint for SimpleTex ---
app.post('/upload', upload.single('formulaImage'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file was uploaded.' });
  }

  const { SIMPLETEX_API_TOKEN } = process.env;
  if (!SIMPLETEX_API_TOKEN) {
    return res.status(500).json({ error: 'API token for SimpleTex is not configured on the server.' });
  }

  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log('Sending image to SimpleTex API...');
    const userToken = req.body.simpletexToken;
    const apiToken = userToken || process.env.SIMPLETEX_API_TOKEN;

    if (!apiToken) {
        return res.status(400).json({ error: 'SimpleTex API token is missing. Please provide one.' });
    }

    const simpleTexResponse = await axios.post(
      'https://server.simpletex.net/api/latex_ocr_turbo',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'token': apiToken,
        },
        data: { 'rec_mode': 'formula' }
      }
    );

    console.log('Received response from SimpleTex.');
    
    const responseData = simpleTexResponse.data;
    console.log(responseData)

    if (!responseData?.status || !responseData.res?.latex) {
        console.error('SimpleTex Error:', responseData.message || 'Could not find LaTeX in response.');
        return res.status(500).json({ error: responseData.message || 'Failed to recognize formula.' });
    }

    const latexText = responseData.res.latex;
    // const latexText = responseData.res.latex.replace(/\\\\/g, '\\');
    console.log(latexText)

    const converter = req.body.converter || 'tex2typst'; // Default to tex2typst
    let typstOutput;

    console.log(`Using converter: ${converter}`);

    if (converter === 'pandoc') {
        try {
            const pandocServiceUrl = process.env.PANDOC_SERVICE_URL || 'http://localhost:7999/convert';
            
            const response = await fetch(pandocServiceUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latex: `$${latexText}$` })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Pandoc service failed with status ${response.status}: ${errorBody}`);
            }

            const result = await response.json();
            typstOutput = result.typst;

        } catch (pandocError) {
            console.error('Pandoc service error:', pandocError.message);
            return res.status(500).json({ 
                error: 'The Pandoc conversion service is unavailable or failed.',
                details: pandocError.message 
            });
        }
    } else {
        const typstInput = latexText.includes('$') ? latexText : `$${latexText}$`
        typstOutput = tex2typst(typstInput);
    }
    
    console.log('Conversion successful.');

    res.json({ typst: typstOutput, latex: latexText });

  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('An error occurred during the process:', errorMessage);
    res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});