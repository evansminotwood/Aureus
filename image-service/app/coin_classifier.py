"""
Coin classification using CLIP (Contrastive Language-Image Pretraining)
Free, open-source ML model from OpenAI for zero-shot image classification
"""
import torch
from PIL import Image
import numpy as np
from typing import Dict, Any, List, Tuple
import logging
import clip

logger = logging.getLogger(__name__)

_clip_model = None
_clip_preprocess = None

def load_clip_model():
    """Lazy load CLIP model to save memory"""
    global _clip_model, _clip_preprocess

    if _clip_model is None:
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _clip_model, _clip_preprocess = clip.load("ViT-B/32", device=device)
            logger.info(f"CLIP model loaded successfully on {device}")
        except Exception as e:
            logger.error(f"Failed to load CLIP model: {e}")
            raise

    return _clip_model, _clip_preprocess

COIN_TYPES = {
    "morgan_dollar": "a Morgan silver dollar coin with Liberty head and eagle, minted 1878-1904 and 1921",
    "peace_dollar": "a Peace silver dollar coin with Liberty head and eagle at rest, minted 1921-1935",
    "walking_liberty_half": "a Walking Liberty half dollar with Liberty walking and eagle, minted 1916-1947",
    "franklin_half": "a Franklin half dollar with Benjamin Franklin portrait and Liberty Bell, minted 1948-1963",
    "kennedy_half": "a Kennedy half dollar with John F. Kennedy portrait, minted 1964-present",
    "washington_quarter": "a Washington quarter with George Washington portrait, minted 1932-present",
    "standing_liberty_quarter": "a Standing Liberty quarter with Liberty standing, minted 1916-1930",
    "barber_quarter": "a Barber quarter with Liberty head, minted 1892-1916",
    "mercury_dime": "a Mercury dime with Liberty head with winged cap, minted 1916-1945",
    "roosevelt_dime": "a Roosevelt dime with Franklin D. Roosevelt portrait, minted 1946-present",
    "barber_dime": "a Barber dime with Liberty head, minted 1892-1916",
    "buffalo_nickel": "a Buffalo nickel with Native American and buffalo, minted 1913-1938",
    "jefferson_nickel": "a Jefferson nickel with Thomas Jefferson portrait, minted 1938-present",
    "lincoln_cent": "a Lincoln penny with Abraham Lincoln portrait, minted 1909-present",
    "indian_head_cent": "an Indian Head penny with Native American portrait, minted 1859-1909",
    "wheat_cent": "a Lincoln Wheat penny with wheat stalks on reverse, minted 1909-1958",
    "american_eagle_silver": "an American Silver Eagle bullion coin with walking Liberty and eagle",
    "american_eagle_gold": "an American Gold Eagle bullion coin with Liberty and eagle",
    "modern_commemorative": "a modern commemorative US coin with special design",
    "state_quarter": "a US State quarter with state-specific design on reverse, minted 1999-2008",
    "unknown_coin": "an unidentifiable or foreign coin",
}

COIN_DENOMINATIONS = {
    "morgan_dollar": "$1",
    "peace_dollar": "$1",
    "walking_liberty_half": "$0.50",
    "franklin_half": "$0.50",
    "kennedy_half": "$0.50",
    "washington_quarter": "$0.25",
    "standing_liberty_quarter": "$0.25",
    "barber_quarter": "$0.25",
    "state_quarter": "$0.25",
    "mercury_dime": "$0.10",
    "roosevelt_dime": "$0.10",
    "barber_dime": "$0.10",
    "buffalo_nickel": "$0.05",
    "jefferson_nickel": "$0.05",
    "lincoln_cent": "$0.01",
    "indian_head_cent": "$0.01",
    "wheat_cent": "$0.01",
    "american_eagle_silver": "$1 (Bullion)",
    "american_eagle_gold": "$50 (Bullion)",
    "modern_commemorative": "Varies",
    "unknown_coin": "Unknown",
}

COIN_BASE_VALUES = {
    "morgan_dollar": 30.00,
    "peace_dollar": 25.00,
    "walking_liberty_half": 15.00,
    "franklin_half": 10.00,
    "kennedy_half": 7.00,
    "washington_quarter": 5.00,
    "standing_liberty_quarter": 20.00,
    "barber_quarter": 15.00,
    "state_quarter": 0.50,
    "mercury_dime": 3.00,
    "roosevelt_dime": 2.00,
    "barber_dime": 10.00,
    "buffalo_nickel": 2.00,
    "jefferson_nickel": 0.50,
    "lincoln_cent": 0.10,
    "indian_head_cent": 5.00,
    "wheat_cent": 0.25,
    "american_eagle_silver": 35.00,
    "american_eagle_gold": 2000.00,
    "modern_commemorative": 50.00,
    "unknown_coin": 0.00,
}

def classify_coin_with_clip(image: Image.Image) -> Dict[str, Any]:
    """
    Classify a coin using CLIP model

    Args:
        image: PIL Image of the coin

    Returns:
        Dictionary with coin classification results
    """
    try:
        model, preprocess = load_clip_model()
        device = "cuda" if torch.cuda.is_available() else "cpu"

        image_input = preprocess(image).unsqueeze(0).to(device)

        text_descriptions = [desc for desc in COIN_TYPES.values()]
        text_tokens = torch.cat([clip.tokenize(desc) for desc in text_descriptions]).to(device)

        with torch.no_grad():
            image_features = model.encode_image(image_input)
            text_features = model.encode_text(text_tokens)

            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            values, indices = similarity[0].topk(3)

        predictions = []
        coin_type_keys = list(COIN_TYPES.keys())

        for i, (value, index) in enumerate(zip(values, indices)):
            coin_key = coin_type_keys[index]
            confidence = float(value)

            predictions.append({
                "rank": i + 1,
                "coin_type": coin_key.replace("_", " ").title(),
                "confidence": round(confidence, 4),
                "denomination": COIN_DENOMINATIONS.get(coin_key, "Unknown"),
                "estimated_value": COIN_BASE_VALUES.get(coin_key, 0.00),
            })

        best_prediction = predictions[0]

        logger.info(f"CLIP Classification: {best_prediction['coin_type']} (confidence: {best_prediction['confidence']})")

        return {
            "success": True,
            "coin_type": best_prediction["coin_type"],
            "denomination": best_prediction["denomination"],
            "estimated_value": best_prediction["estimated_value"],
            "confidence": best_prediction["confidence"],
            "alternative_predictions": predictions[1:],
            "method": "CLIP Zero-Shot Classification"
        }

    except Exception as e:
        logger.error(f"Error in CLIP classification: {e}")
        return {
            "success": False,
            "error": str(e),
            "coin_type": "Unknown",
            "denomination": "Unknown",
            "estimated_value": 0.00,
            "confidence": 0.00,
            "method": "CLIP Zero-Shot Classification (Failed)"
        }

def extract_year_from_ocr(text: str) -> int:
    """
    Extract year from OCR text with improved pattern matching.
    Handles common OCR errors where digits are misread.
    """
    import re

    # First try: exact 4-digit year match
    year_match = re.search(r'\b(1[7-9]\d{2}|20\d{2}|21\d{2})\b', text)
    if year_match:
        return int(year_match.group(1))

    # Second try: handle common OCR misreads
    # Common errors: 0->O, 1->I/l, 8->B, 9->g, 5->S, etc.
    cleaned_text = text.upper()

    # Replace common OCR mistakes
    replacements = {
        'O': '0', 'o': '0',
        'I': '1', 'l': '1', '|': '1',
        'B': '8', 'b': '8',
        'g': '9', 'q': '9',
        'S': '5', 's': '5',
        'Z': '2', 'z': '2'
    }

    for old, new in replacements.items():
        cleaned_text = cleaned_text.replace(old, new)

    # Try again with cleaned text
    year_match = re.search(r'\b(1[7-9]\d{2}|20\d{2}|21\d{2})\b', cleaned_text)
    if year_match:
        return int(year_match.group(1))

    # Third try: look for patterns like "187" or "188" followed by a digit
    # Common for Morgan/Peace dollars (1878-1935)
    pattern_match = re.search(r'(18[7-9]\d|19[0-3]\d|194\d|195\d|196\d)', text)
    if pattern_match:
        return int(pattern_match.group(1))

    return None

def classify_coin_hybrid(image: Image.Image, ocr_text: str = "") -> Dict[str, Any]:
    """
    Hybrid approach: Use CLIP for coin type, OCR for year/details

    Args:
        image: PIL Image of the coin
        ocr_text: Optional OCR text from the coin

    Returns:
        Combined classification results
    """
    clip_result = classify_coin_with_clip(image)

    year = None
    if ocr_text:
        year = extract_year_from_ocr(ocr_text)
        if year:
            logger.info(f"Extracted year from OCR: {year}")
        else:
            logger.warning(f"No year found in OCR text: '{ocr_text.strip()}'")

    result = clip_result.copy()
    if year:
        result["year"] = year
        if year < 1965 and "dollar" in result["coin_type"].lower():
            result["estimated_value"] = max(result["estimated_value"], 30.00)
        elif year < 1965 and result["denomination"] in ["$0.50", "$0.25", "$0.10"]:
            result["estimated_value"] = max(result["estimated_value"], 5.00)

    return result

def get_coin_details(coin_type: str, year: int = None) -> Dict[str, Any]:
    """
    Get detailed information about a coin type

    Args:
        coin_type: Type of coin
        year: Optional year of the coin

    Returns:
        Detailed coin information
    """
    coin_key = coin_type.lower().replace(" ", "_")

    details = {
        "coin_type": coin_type,
        "denomination": COIN_DENOMINATIONS.get(coin_key, "Unknown"),
        "base_value": COIN_BASE_VALUES.get(coin_key, 0.00),
        "year": year,
    }

    if year and year < 1965:
        if "dollar" in coin_key or "half" in coin_key or "quarter" in coin_key or "dime" in coin_key:
            details["composition"] = "90% Silver, 10% Copper"
            details["silver_content"] = True
    elif year and year >= 1965:
        details["composition"] = "Copper-Nickel Clad"
        details["silver_content"] = False

    return details
