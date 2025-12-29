from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import cv2
import numpy as np
import pytesseract
import re
from typing import List, Dict, Any
import logging

from app.coin_classifier import classify_coin_hybrid, classify_coin_with_clip, get_coin_details

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Coin Image Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "image-analysis"}

@app.get("/")
async def root():
    """API information and available endpoints"""
    return {
        "service": "Aureus Coin Image Analysis Service",
        "version": "2.0.0",
        "features": [
            "ML-powered coin identification using CLIP",
            "OCR-based text extraction",
            "Circle detection for multi-coin analysis",
            "Year and denomination detection",
            "Value estimation"
        ],
        "endpoints": {
            "/health": "Health check",
            "/identify": "Identify a single coin (ML + OCR)",
            "/analyze": "Analyze image with multiple coins",
        },
        "ml_model": "OpenAI CLIP (ViT-B/32)",
        "documentation": "/docs"
    }

@app.post("/analyze")
async def analyze_coins(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze an image to detect and identify coins
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        img_array = np.array(image)
        if len(img_array.shape) == 2:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
        elif img_array.shape[2] == 4:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
        else:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        detected_coins = detect_coins_simple(img_cv)
        
        results = {
            "success": True,
            "image_size": {
                "width": image.width,
                "height": image.height
            },
            "detected_coins": detected_coins,
            "total_coins": len(detected_coins),
            "estimated_total_value": sum(coin["estimated_value"] for coin in detected_coins)
        }
        
        logger.info(f"Analyzed image: found {len(detected_coins)} coins")
        return results
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def detect_coins_simple(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Coin detection using circle detection + OCR for text recognition
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    blurred = cv2.GaussianBlur(gray, (15, 15), 2)
    
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.5,
        minDist=100,
        param1=200,
        param2=80,
        minRadius=50,
        maxRadius=300
    )
    
    detected_coins = []
    
    if circles is not None:
        circles = np.uint16(np.around(circles))
        
        circles = circles[0, :min(10, len(circles[0]))]
        
        for i, circle in enumerate(circles):
            x, y, radius = circle
            
            if radius < 50 or radius > 300:
                continue
            
            coin_region = extract_coin_region(image, x, y, radius)
            
            coin_info = identify_coin_with_ocr(coin_region, i, x, y, radius)
            
            detected_coins.append(coin_info)
    
    logger.info(f"Detected {len(detected_coins)} coins with OCR analysis")
    
    return detected_coins

def identify_coin_with_ocr(coin_image: np.ndarray, coin_id: int, x: int, y: int, radius: int, use_ml: bool = True) -> Dict[str, Any]:
    """
    Use OCR and optionally ML model to identify coin

    Args:
        coin_image: Coin image array
        coin_id: ID of the coin
        x, y, radius: Position information
        use_ml: Whether to use ML model (default True)
    """
    coin_type = "Unknown Coin"
    denomination = "Unknown"
    year = None
    estimated_value = 0.00
    confidence = 0.50
    text = ""
    ml_result = None

    try:
        if use_ml:
            try:
                if len(coin_image.shape) == 3:
                    pil_image = Image.fromarray(cv2.cvtColor(coin_image, cv2.COLOR_BGR2RGB))
                else:
                    pil_image = Image.fromarray(coin_image)

                ml_result = classify_coin_with_clip(pil_image)

                if ml_result.get("success"):
                    coin_type = ml_result["coin_type"]
                    denomination = ml_result["denomination"]
                    estimated_value = ml_result["estimated_value"]
                    confidence = ml_result["confidence"]
                    logger.info(f"ML model identified coin {coin_id} as {coin_type} with confidence {confidence}")
            except Exception as e:
                logger.warning(f"ML model failed for coin {coin_id}: {e}, falling back to OCR")

        if len(coin_image.shape) == 3:
            gray = cv2.cvtColor(coin_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = coin_image

        ocr_results = []

        # Upscale the image for better OCR (coins are often small)
        scale_factor = 3
        height, width = gray.shape
        upscaled = cv2.resize(gray, (width * scale_factor, height * scale_factor), interpolation=cv2.INTER_CUBIC)

        # Method 1: Digit-only OCR with binary threshold
        try:
            _, binary = cv2.threshold(upscaled, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text1 = pytesseract.image_to_string(binary, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            if text1.strip():
                ocr_results.append(text1)
                logger.info(f"OCR Method 1 (digit-only binary) extracted: '{text1.strip()}'")
        except Exception as e:
            logger.warning(f"OCR Method 1 failed: {e}")

        # Method 2: Digit-only OCR with inverted threshold
        try:
            _, binary_inv = cv2.threshold(upscaled, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            text2 = pytesseract.image_to_string(binary_inv, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            if text2.strip():
                ocr_results.append(text2)
                logger.info(f"OCR Method 2 (digit-only inverted) extracted: '{text2.strip()}'")
        except Exception as e:
            logger.warning(f"OCR Method 2 failed: {e}")

        # Method 3: CLAHE enhancement with digit-only
        try:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(upscaled)
            _, thresh3 = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text3 = pytesseract.image_to_string(thresh3, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            if text3.strip():
                ocr_results.append(text3)
                logger.info(f"OCR Method 3 (CLAHE + digits) extracted: '{text3.strip()}'")
        except Exception as e:
            logger.warning(f"OCR Method 3 failed: {e}")

        # Method 4: Standard OCR for text (coin type, etc.)
        try:
            adaptive = cv2.adaptiveThreshold(upscaled, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            text4 = pytesseract.image_to_string(adaptive, config='--psm 11 --oem 3')
            if text4.strip():
                ocr_results.append(text4)
        except Exception as e:
            logger.warning(f"OCR Method 4 failed: {e}")

        text = " ".join(ocr_results)
        logger.info(f"Combined OCR text for coin {coin_id}: '{text}'")

        year_match = re.search(r'\b(1[7-9]\d{2}|20\d{2}|21\d{2})\b', text)
        if year_match:
            year = int(year_match.group(1))
            logger.info(f"OCR found year: {year}")

            # If ML model was used, enhance the results with year
            if ml_result and ml_result.get("success"):
                # Adjust value based on year
                if year < 1965 and "dollar" in coin_type.lower():
                    estimated_value = max(estimated_value, 30.00)
                elif year < 1965 and denomination in ["$0.50", "$0.25", "$0.10"]:
                    estimated_value = max(estimated_value, 5.00)
        else:
            logger.warning(f"No year found in OCR text for coin {coin_id}. Text was: '{text}'")

        if not ml_result or not ml_result.get("success"):
            logger.info("Using OCR-based fallback identification")
            text_lower = text.lower()

            if "morgan" in text_lower or ("liberty" in text_lower and "dollar" in text_lower):
                coin_type = "Morgan Dollar"
                denomination = "$1"
                estimated_value = 25.00
                confidence = 0.60
            elif "peace" in text_lower and "dollar" in text_lower:
                coin_type = "Peace Dollar"
                denomination = "$1"
                estimated_value = 25.00
                confidence = 0.60
            elif "washington" in text_lower:
                coin_type = "Washington Quarter"
                denomination = "$0.25"
                estimated_value = 0.25
                confidence = 0.55
            elif "kennedy" in text_lower:
                coin_type = "Kennedy Half Dollar"
                denomination = "$0.50"
                estimated_value = 0.50
                confidence = 0.55
            elif "liberty" in text_lower:
                coin_type = "Liberty Coin"
                denomination = "Unknown"
                estimated_value = 5.00
                confidence = 0.50

        confidence = min(confidence, 0.95)

    except Exception as e:
        logger.error(f"Error in identify_coin_with_ocr: {str(e)}")

    return {
        "id": coin_id,
        "position": {
            "x": int(x),
            "y": int(y),
            "radius": int(radius)
        },
        "coin_type": coin_type,
        "denomination": denomination,
        "year": year,
        "estimated_value": round(estimated_value, 2),
        "confidence": round(confidence, 2)
    }

def extract_coin_region(image: np.ndarray, x: int, y: int, radius: int) -> np.ndarray:
    """
    Extract a square region around the detected coin
    """
    padding = int(radius * 0.2)
    x1 = max(0, x - radius - padding)
    y1 = max(0, y - radius - padding)
    x2 = min(image.shape[1], x + radius + padding)
    y2 = min(image.shape[0], y + radius + padding)
    
    return image[y1:y2, x1:x2]

@app.post("/identify")
async def identify_coin(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Identify a single coin from an image using ML model
    More detailed analysis for a single coin
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        img_array = np.array(image)
        if len(img_array.shape) == 2:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
        elif img_array.shape[2] == 4:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
        else:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        ocr_text = ""
        try:
            # Try multiple OCR approaches optimized for coin date detection
            ocr_results = []

            # Upscale for better number recognition (coins often have small text)
            scale_factor = 3
            height, width = gray.shape
            upscaled = cv2.resize(gray, (width * scale_factor, height * scale_factor), interpolation=cv2.INTER_CUBIC)

            # Method 1: High contrast binary threshold for clear numbers
            _, binary = cv2.threshold(upscaled, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text1 = pytesseract.image_to_string(binary, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            ocr_results.append(text1)

            # Method 2: Inverted threshold (for dark coins with light text)
            _, binary_inv = cv2.threshold(upscaled, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            text2 = pytesseract.image_to_string(binary_inv, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            ocr_results.append(text2)

            # Method 3: Adaptive threshold for varying lighting
            adaptive = cv2.adaptiveThreshold(upscaled, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            text3 = pytesseract.image_to_string(adaptive, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            ocr_results.append(text3)

            # Method 4: Enhanced contrast with CLAHE
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(upscaled)
            _, thresh4 = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text4 = pytesseract.image_to_string(thresh4, config='--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789')
            ocr_results.append(text4)

            # Method 5: Standard OCR without digit restriction (for backup)
            text5 = pytesseract.image_to_string(upscaled, config='--psm 11')
            ocr_results.append(text5)

            # Combine all OCR results
            ocr_text = " ".join(ocr_results)
            logger.info(f"OCR extracted digits: {[t.strip() for t in ocr_results if t.strip()]}")
        except Exception as e:
            logger.warning(f"OCR failed: {e}")

        result = classify_coin_hybrid(image, ocr_text)

        if result.get("year"):
            coin_details = get_coin_details(result["coin_type"], result["year"])
            result.update(coin_details)

        result["notes"] = f"Identified using CLIP ML model with {result['confidence']*100:.1f}% confidence"

        return result

    except Exception as e:
        logger.error(f"Error identifying coin: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Identification failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)