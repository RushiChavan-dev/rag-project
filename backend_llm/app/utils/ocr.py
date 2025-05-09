# app/utils/ocr.py
"""
OCR and text extraction utilities for PDF and image documents,
using OCR.Space for simplicity (no local Tesseract).
"""
import os
import requests
from typing import List
from pdfminer.high_level import extract_text as pdfminer_extract_text
from langchain.schema import Document

OCR_SPACE_API_KEY = "K81649685088957"
OCR_SPACE_URL     = "https://api.ocr.space/parse/image"

def ocr_space_file(path: str, language: str = "eng") -> str:
    """
    Send the file (PDF/image) to OCR.Space and return parsed text.
    """
    with open(path, "rb") as f:
        payload = {
            "apikey": OCR_SPACE_API_KEY,
            "language": language,
            "isOverlayRequired": False,
        }
        files = {"file": f}
        r = requests.post(OCR_SPACE_URL, data=payload, files=files)
        r.raise_for_status()
        result = r.json()
        if result.get("IsErroredOnProcessing"):
            return ""
        return result["ParsedResults"][0]["ParsedText"] or ""

def extract_text_from_pdf(path: str) -> str:
    """
    Try born-digital extraction first, then fallback to OCR.Space.
    """
    try:
        txt = pdfminer_extract_text(path)
    except Exception:
        txt = ""
    if txt and txt.strip():
        return txt
    # fallback
    return ocr_space_file(path)

def extract_text_from_image(path: str) -> str:
    """
    OCR an image via OCR.Space.
    """
    return ocr_space_file(path)

def load_docs_with_ocr(path: str) -> List[Document]:
    """
    Load text from PDF or image via native or OCR.Space.
    """
    ext = os.path.splitext(path)[1].lower()
    if ext not in {".pdf", ".png", ".jpg", ".jpeg"}:
        return []

    if ext == ".pdf":
        text = extract_text_from_pdf(path)
    else:
        text = extract_text_from_image(path)

    if not text or not text.strip():
        return []

    return [Document(page_content=text)]



# # app/utils/ocr.py
# """
# OCR and text extraction utilities for PDF and image documents.
# """
# import os
# from typing import List
# from pdfminer.high_level import extract_text as pdfminer_extract_text
# from pdf2image import convert_from_path
# import pytesseract
# from PIL import Image
# from langchain.schema import Document


# def extract_text_from_pdf(path: str, dpi: int = 300, lang: str = "eng") -> str:
#     """
#     Attempt to extract born-digital text from a PDF using pdfminer.
#     Falls back to OCR if no text is found.

#     Args:
#         path: Path to the PDF file.
#         dpi: Resolution for image conversion in OCR fallback.
#         lang: Language code for Tesseract OCR.

#     Returns:
#         The concatenated text from all pages.
#     """
#     # 1. Try born-digital extraction
#     try:
#         text = pdfminer_extract_text(path)
#     except Exception:
#         text = ""
    
#     # 2. If no text, run OCR on pages
#     if not text or not text.strip():
#         text = ""
#         pages = convert_from_path(path, dpi=dpi)
#         for page in pages:
#             if page.mode != "L":
#                 page = page.convert("L")
#             text += pytesseract.image_to_string(page, lang=lang)
    
#     return text


# def extract_text_from_image(path: str, lang: str = "eng") -> str:
#     """
#     Run Tesseract OCR on a single image file.

#     Args:
#         path: Path to the image file (.png, .jpg, etc.).
#         lang: Language code for Tesseract OCR.

#     Returns:
#         The OCR-extracted text.
#     """
#     try:
#         img = Image.open(path)
#         if img.mode != "L":
#             img = img.convert("L")
#         return pytesseract.image_to_string(img, lang=lang)
#     except Exception:
#         return ""


# def load_docs_with_ocr(path: str) -> List[Document]:
#     """
#     Load text from a document file using native extraction or OCR.
#     Supports PDFs and common image formats.

#     Args:
#         path: Path to the file (.pdf, .png, .jpg, .jpeg).

#     Returns:
#         A list containing a single LangChain Document with full text.
#     """
#     ext = os.path.splitext(path)[1].lower()
#     text = ""

#     if ext == ".pdf":
#         text = extract_text_from_pdf(path)
#     elif ext in {".png", ".jpg", ".jpeg"}:
#         text = extract_text_from_image(path)
#     else:
#         # Unsupported extension
#         return []

#     if not text or not text.strip():
#         return []

#     return [Document(page_content=text)]
