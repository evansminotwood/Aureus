# Image Analysis Service - Python/FastAPI

AI-powered coin identification and image analysis service using machine learning (CLIP) and OCR (Tesseract). This service analyzes uploaded coin images to identify coin types, extract dates, and estimate values.

## Tech Stack

- **Language**: Python 3.11
- **Framework**: FastAPI
- **ML Model**: OpenAI CLIP (ViT-B/32)
- **Computer Vision**: OpenCV
- **OCR**: Tesseract
- **Image Processing**: Pillow, NumPy
- **Deep Learning**: PyTorch, Torchvision

## Features

### ML-Powered Identification
- Pre-trained CLIP model for coin type classification
- High-accuracy identification of US coins
- Confidence scoring for predictions

### Multi-Coin Detection
- Hough Circle Transform for coin detection
- Handles multiple coins in a single image
- Individual analysis for each detected coin

### OCR Text Extraction
- Multiple OCR preprocessing techniques
- Specialized date/year extraction
- Denomination and mint mark detection
- Adaptive threshold processing for varying lighting

### Value Estimation
- Basic value estimation based on coin type
- Year-based value adjustments
- Silver content detection for pre-1965 coins

## Project Structure

```
image-service/
├── app/
│   ├── main.py              # FastAPI application & endpoints
│   └── coin_classifier.py   # CLIP model & coin classification
├── Dockerfile               # Container configuration
└── requirements.txt         # Python dependencies
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "image-analysis"
}
```

### Service Information
```
GET /
```
Returns API information and capabilities.

**Response:**
```json
{
  "service": "Aureus Coin Image Analysis Service",
  "version": "2.0.0",
  "features": [...],
  "endpoints": {...},
  "ml_model": "OpenAI CLIP (ViT-B/32)"
}
```

### Analyze Multiple Coins
```
POST /analyze
```
Detect and identify multiple coins in an image.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Image file (JPG, PNG)

**Response:**
```json
{
  "success": true,
  "image_size": {
    "width": 1920,
    "height": 1080
  },
  "detected_coins": [
    {
      "id": 0,
      "position": {
        "x": 450,
        "y": 320,
        "radius": 85
      },
      "coin_type": "Morgan Dollar",
      "denomination": "$1",
      "year": 1921,
      "estimated_value": 30.00,
      "confidence": 0.89
    }
  ],
  "total_coins": 1,
  "estimated_total_value": 30.00
}
```

### Identify Single Coin
```
POST /identify
```
Detailed identification of a single coin image.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Image file (JPG, PNG)

**Response:**
```json
{
  "success": true,
  "coin_type": "Peace Dollar",
  "denomination": "$1",
  "year": 1925,
  "estimated_value": 28.00,
  "confidence": 0.92,
  "composition": "90% Silver, 10% Copper",
  "weight": "26.73g",
  "diameter": "38.1mm",
  "notes": "Identified using CLIP ML model with 92.0% confidence"
}
```

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Tesseract OCR engine
- Docker (recommended)

### Installation

#### Option 1: Docker (Recommended)

Build and run using Docker Compose from the project root:
```bash
docker-compose up -d image-service
```

The service will be available at `http://localhost:8001`

#### Option 2: Local Installation

1. **Install Python dependencies**
   ```bash
   cd image-service
   pip install -r requirements.txt
   ```

2. **Install Tesseract OCR**

   **macOS:**
   ```bash
   brew install tesseract
   ```

   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install tesseract-ocr tesseract-ocr-eng
   ```

   **Windows:**
   Download installer from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

3. **Run the service**
   ```bash
   cd image-service
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   Access the service at `http://localhost:8000`

## Development

### Running Locally

```bash
cd image-service
python -m uvicorn app.main:app --reload --port 8000
```

### Interactive API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Testing the API

**Using curl:**
```bash
# Health check
curl http://localhost:8001/health

# Identify a single coin
curl -X POST http://localhost:8001/identify \
  -F "file=@/path/to/coin-image.jpg"

# Analyze multiple coins
curl -X POST http://localhost:8001/analyze \
  -F "file=@/path/to/coins-image.jpg"
```

**Using Python:**
```python
import requests

# Identify a coin
with open('coin.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8001/identify',
        files={'file': f}
    )
    print(response.json())
```

### Adding New Coin Types

To add support for new coin types, update the `coin_classifier.py` file:

1. Add coin type to the classification prompts
2. Update the coin details dictionary
3. Add composition and specification data
4. Test with sample images

## ML Model

### CLIP (Contrastive Language-Image Pre-training)

The service uses OpenAI's CLIP model (ViT-B/32) for coin identification:

- **Model**: Vision Transformer Base with 32x32 patches
- **Training**: Pre-trained on 400M image-text pairs
- **Zero-shot**: Can classify without specific training data
- **Multimodal**: Understands both images and text

### How It Works

1. Image is processed and converted to embeddings
2. Text prompts for each coin type are encoded
3. Cosine similarity between image and text embeddings
4. Highest similarity score determines coin type
5. OCR extracts specific details (year, mint mark)

### Model Loading

The CLIP model is loaded on first use and cached in memory:
- First request: ~3-5 seconds (model download + load)
- Subsequent requests: ~100-500ms per image

## OCR Processing

The service uses multiple OCR preprocessing techniques for robust text extraction:

### Preprocessing Methods

1. **Binary Threshold**: High contrast for clear numbers
2. **Inverted Threshold**: Dark coins with light text
3. **CLAHE Enhancement**: Contrast-limited adaptive histogram equalization
4. **Adaptive Threshold**: Handles varying lighting conditions
5. **Image Upscaling**: 3x scaling for better character recognition

### Year Extraction

Uses regex pattern matching to find 4-digit years (1700-2199):
```python
year_pattern = r'\b(1[7-9]\d{2}|20\d{2}|21\d{2})\b'
```

## Coin Detection

### Circle Detection (Hough Transform)

Parameters optimized for coin detection:
- **dp**: 1.5 (inverse ratio of accumulator resolution)
- **minDist**: 100 pixels (minimum distance between circles)
- **param1**: 200 (Canny edge detector threshold)
- **param2**: 80 (accumulator threshold for circle centers)
- **minRadius**: 50 pixels
- **maxRadius**: 300 pixels

### Region Extraction

Each detected coin is extracted with 20% padding for better OCR results.

## Supported Coin Types

The service can identify:
- Morgan Dollars (1878-1921)
- Peace Dollars (1921-1935)
- Kennedy Half Dollars (1964-present)
- Washington Quarters (1932-present)
- Roosevelt Dimes (1946-present)
- Jefferson Nickels (1938-present)
- Lincoln Pennies (1909-present)
- American Silver Eagles (1986-present)
- Buffalo Nickels (1913-1938)

## Performance

### Benchmarks (approximate)

- **Single coin identification**: 100-500ms
- **Multi-coin detection (3-5 coins)**: 500ms-2s
- **OCR processing per coin**: 200-400ms
- **ML inference per coin**: 100-300ms

### Memory Usage

- Base service: ~500MB
- CLIP model loaded: ~1.5GB
- Peak usage (processing): ~2GB

## Limitations

1. **Image Quality**: Best results with clear, well-lit images
2. **Coin Condition**: Heavily worn coins may reduce accuracy
3. **Angle**: Works best with coins photographed straight-on
4. **Overlap**: Overlapping coins may not be detected separately
5. **Foreign Coins**: Currently optimized for US coins only

## Error Handling

The service returns HTTP errors with descriptive messages:

```json
{
  "detail": "Analysis failed: Invalid image format"
}
```

Common status codes:
- `200 OK` - Successful processing
- `422 Unprocessable Entity` - Invalid file format
- `500 Internal Server Error` - Processing error

## Logging

Structured logging to stdout:
```
INFO: Detected 3 coins with OCR analysis
INFO: ML model identified coin 0 as Morgan Dollar with confidence 0.89
INFO: OCR found year: 1921
```

View logs:
```bash
# Docker
docker logs aureus-image-service

# Local
# Output appears in terminal
```

## Docker

### Building the Image

```bash
cd image-service
docker build -t aureus-image-service .
```

### Running the Container

```bash
docker run -p 8001:8000 aureus-image-service
```

### Dockerfile Details

The image includes:
- Python 3.11 slim base
- System dependencies (OpenCV, Tesseract)
- Python packages from requirements.txt
- CLIP model (downloaded on first use)

## Dependencies

Key packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `opencv-python-headless` - Computer vision (no GUI)
- `pytesseract` - OCR wrapper for Tesseract
- `torch` + `torchvision` - Deep learning framework
- `clip` - OpenAI's CLIP model
- `pillow` - Image processing
- `numpy` - Numerical operations

## Future Enhancements

- [ ] YOLOv8 integration for improved detection
- [ ] Grade estimation based on image quality
- [ ] Batch processing for multiple images
- [ ] WebSocket support for real-time processing
- [ ] Model fine-tuning on coin-specific dataset
- [ ] Support for world coins
- [ ] Error coin detection
- [ ] Coin rotation/orientation correction

## Troubleshooting

### Tesseract Not Found
```
Error: Tesseract not found in PATH
```
**Solution**: Install Tesseract OCR (see Installation section)

### Model Download Fails
```
Error downloading CLIP model
```
**Solution**: Check internet connection, may need to configure proxy

### Out of Memory
```
Killed: Out of memory
```
**Solution**: Increase Docker memory limit or reduce image size

### Poor Detection Results
**Solutions:**
- Use higher resolution images (min 1000px width)
- Ensure good lighting (no harsh shadows)
- Photograph coins on contrasting background
- Keep coins flat and non-overlapping

## Related Services

- [Backend](../backend/README.md) - Go API server
- [Frontend](../frontend/README.md) - Next.js web interface

---

Built with Python, FastAPI, OpenAI CLIP, and Tesseract
