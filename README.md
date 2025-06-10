# LaTeX to Typst Converter

A web application that converts LaTeX formulas from images to Typst format. The application uses SimpleTex API for OCR and offers two conversion methods: Pandoc and tex2typst.
<img width="1000" alt="image" src="https://github.com/user-attachments/assets/6c7e6f98-696c-421d-bf26-60aa6a05d6d1" />


## Project Structure

```
latex-to-typst/
├── .env                    # Environment variables
├── package.json           # Node.js dependencies
├── server.js             # Main server file
├── public/               # Frontend files
│   ├── index.html
│   ├── style.css
│   └── script.js
└── pandoc-service/       # Pandoc conversion service
    ├── main.py          # FastAPI application
    ├── requirements.txt # Python dependencies
    ├── Dockerfile      # Docker configuration
    └── run.sh         # Local run script
```

## Prerequisites

- Node.js (v14 or higher)
- Python 3.9 or higher
- Pandoc (installed via the pandoc-service)
- SimpleTex API token

## Local Development Setup

### 1. Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd latex_to_typst
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   SIMPLETEX_API_TOKEN=your_simpletex_token_here
   ```

3. Start the frontend server:
   ```bash
   npm start
   ```
   The server will run at http://localhost:3000

### 2. Pandoc Service Setup

1. Install Python dependencies:
   ```bash
   cd pandoc-service
   pip install -r requirements.txt
   ```

2. Start the Pandoc service:
   ```bash
   sh run.sh
   ```
   The service will run at http://localhost:7999

## Usage

1. Open http://localhost:3000 in your browser
2. Upload an image containing a LaTeX formula
3. Choose your preferred conversion method (Pandoc or tex2typst)
4. Click "Convert" to get the Typst output

## Deployment

### Frontend (Vercel)
- The frontend is configured for deployment on Vercel
- Set the `PANDOC_SERVICE_URL` environment variable in Vercel to point to your deployed Pandoc service

### Pandoc Service
- The service can be deployed to any platform that supports Docker
- Example platforms: Render, Fly.io, Heroku, Google Cloud Run
- Make sure to set the correct CORS settings if needed

## License

ISC
