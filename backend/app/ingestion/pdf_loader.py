import pdfplumber


def extract_text_from_pdf(file_path: str) -> list:
    """
    Extracts text from PDF page-wise and returns a list of paragraph dicts
    compatible with the DOCX loader output: {text, style, font_size, bold}
    """

    paragraphs = []

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            chars = page.chars
            if not chars:
                # fallback to page.extract_text if no char-level data
                txt = page.extract_text()
                if txt:
                    for line in txt.splitlines():
                        line = line.strip()
                        if not line:
                            continue
                        paragraphs.append({
                            "text": line,
                            "style": "pdf",
                            "font_size": None,
                            "bold": False,
                        })
                continue

            # Group characters into lines by their 'top' coordinate
            lines = {}
            for c in chars:
                y = round(c.get("top", 0))
                lines.setdefault(y, []).append(c)

            for y in sorted(lines.keys()):
                line_chars = sorted(lines[y], key=lambda c: c.get("x0", 0))
                text = "".join([c.get("text", "") for c in line_chars]).strip()
                if not text:
                    continue

                font_sizes = [c.get("size") for c in line_chars if c.get("size")]
                font_size = max(font_sizes) if font_sizes else None
                bold_found = any("Bold" in (c.get("fontname") or "") for c in line_chars)

                paragraphs.append({
                    "text": text,
                    "style": "pdf",
                    "font_size": font_size,
                    "bold": bold_found,
                })

    return paragraphs
