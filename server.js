// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data'); // Import FormData
const { tex2typst } = require('tex2typst');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// --- Pandoc Conversion Function ---
function convertWithPandoc(latex) {
    return new Promise((resolve, reject) => {
        const pandoc = spawn('pandoc', ['-f', 'latex', '-t', 'typst']);
        let typstOutput = '';
        let errorOutput = '';

        pandoc.stdin.write(latex);
        pandoc.stdin.end();

        pandoc.stdout.on('data', (data) => {
            typstOutput += data.toString();
        });

        pandoc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pandoc.on('close', (code) => {
            if (code !== 0) {
                // Pandoc might exit with code 1 for some warnings that are not critical.
                // We will resolve with output if there is any, otherwise reject.
                if (typstOutput) {
                    console.warn(`Pandoc exited with code ${code} but produced output. Stderr: ${errorOutput}`);
                    resolve(typstOutput.trim());
                } else {
                    reject(new Error(`Pandoc exited with code ${code}: ${errorOutput}`));
                }
            } else {
                resolve(typstOutput.trim());
            }
        });

        pandoc.on('error', (err) => {
            // Handle case where pandoc is not installed
            if (err.code === 'ENOENT') {
                reject(new Error("Pandoc is not installed or not in your system's PATH."));
            } else {
                reject(new Error(`Failed to start Pandoc: ${err.message}`));
            }
        });
    });
}


// --- Middleware ---
// Serve static files from the 'public' directory
app.use(express.static('public'));
// Set up multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- API Endpoint for SimpleTex ---
app.post('/upload', upload.single('formulaImage'), async (req, res) => {
  // 1. Validate Input
  if (!req.file) {
    return res.status(400).json({ error: 'No image file was uploaded.' });
  }

  const { SIMPLETEX_API_TOKEN } = process.env;
  if (!SIMPLETEX_API_TOKEN) {
    return res.status(500).json({ error: 'API token for SimpleTex is not configured on the server.' });
  }

  try {
    // 2. Create a FormData object to send the file
    // SimpleTex expects the image as a multipart/form-data field
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // 3. Call SimpleTex API for Image-to-LaTeX
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

    // 4. Convert LaTeX to Typst using the selected converter
    const converter = req.body.converter || 'tex2typst'; // Default to tex2typst
    let typstOutput;

    console.log(`Using converter: ${converter}`);

    if (converter === 'pandoc') {
        // Pandoc works best with the full LaTeX string without extra math delimiters
        typstOutput = await convertWithPandoc(`$${latexText}$`);
    } else {
        // The tex2typst library expects the formula to be wrapped in $...$
        const typstInput = latexText.includes('$') ? latexText : `$${latexText}$`
        typstOutput = tex2typst(typstInput);
    }
    
    console.log('Conversion successful.');

    // 5. Send Typst and LaTeX result back to the client
    res.json({ typst: typstOutput, latex: latexText });

  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('An error occurred during the process:', errorMessage);
    res.status(500).json({ error: 'An internal server error occurred.', details: errorMessage });
  }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});