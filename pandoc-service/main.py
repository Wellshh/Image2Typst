from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pypandoc
import shutil

app = FastAPI()

class ConversionRequest(BaseModel):
    latex: str

@app.on_event("startup")
async def startup_event():
    # Check if Pandoc is available
    if not shutil.which("pandoc"):
        raise RuntimeError("Pandoc is not installed or not in the system's PATH. Please install Pandoc.")

@app.post("/convert")
async def convert_latex_to_typst(request: ConversionRequest):
    try:
        # Use pypandoc to convert LaTeX to Typst
        typst_output = pypandoc.convert_text(
            request.latex, "typst", format="latex"
        )
        return {"typst": typst_output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 