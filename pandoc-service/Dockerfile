FROM python:3.9-slim
WORKDIR /app
RUN apt-get update && apt-get install -y pandoc
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 80
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"] 