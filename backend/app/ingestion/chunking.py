def _split_text_with_overlap(text, chunk_size, chunk_overlap):
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if chunk_overlap < 0:
        raise ValueError("chunk_overlap must be >= 0")

    # Prevent infinite loops when overlap is too large.
    safe_overlap = min(chunk_overlap, chunk_size - 1) if chunk_size > 1 else 0

    parts = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        piece = text[start:end].strip()
        if piece:
            parts.append(piece)

        if end >= text_len:
            break

        start = end - safe_overlap

    return parts


def _section_text_len(chunk):
    return len(" ".join(chunk.get("content", [])).strip())


def _merge_small_sections(chunks, min_section_chars):
    if min_section_chars <= 0:
        return chunks

    merged = []
    i = 0
    while i < len(chunks):
        current = {
            **chunks[i],
            "content": list(chunks[i].get("content", [])),
        }

        # Keep document-title/root chunks independent.
        if current.get("section_level") == 0:
            merged.append(current)
            i += 1
            continue

        j = i
        while (
            _section_text_len(current) < min_section_chars
            and (j + 1) < len(chunks)
            and chunks[j + 1].get("section_level") != 0
        ):
            next_chunk = chunks[j + 1]
            current["content"].extend(next_chunk.get("content", []))
            current["section"] = f"{current['section']} + {next_chunk['section']}"
            j += 1

        merged.append(current)
        i = j + 1

    return merged


def create_semantic_chunks(
    paragraphs,
    document_id,
    source_file,
    chunk_size=500,
    chunk_overlap=120,
    min_section_chars=600,
):
    # Quick exit for empty input — return a single no-content root chunk so
    # upstream code can report "uploaded_no_embeddings" instead of failing.
    if not paragraphs:
        return [
            {
                "document_id": document_id,
                "chunk_id": f"{document_id}_1",
                "section": "Document",
                "section_level": 0,
                "content": [],
                "source_file": source_file,
            }
        ]

    # If there are no detected headings, treat the whole document as a single
    # section so plain text files still get split and embedded.
    if not any(p.get("is_heading") for p in paragraphs):
        full_content = [p.get("text", "") for p in paragraphs if p.get("text")]
        chunks = [
            {
                "document_id": document_id,
                "chunk_id": f"{document_id}_1",
                "section": "Document",
                "section_level": 1,
                "content": full_content,
                "source_file": source_file,
            }
        ]
    else:
        chunks = []
        current_chunk = None
        chunk_index = 0

        for p in paragraphs:
            if p.get("is_heading"):
                # START new chunk ONLY if section actually changes
                if (
                    current_chunk
                    and p["text"] == current_chunk["section"]
                    and p["heading_level"] == current_chunk["section_level"]
                ):
                    continue  # same section, ignore duplicate heading

                if current_chunk:
                    chunks.append(current_chunk)

                chunk_index += 1
                current_chunk = {
                    "document_id": document_id,
                    "chunk_id": f"{document_id}_{chunk_index}",
                    "section": p["text"],
                    "section_level": p["heading_level"],
                    "content": [],
                    "source_file": source_file
                }
                continue

            if current_chunk:
                current_chunk["content"].append(p["text"])

        if current_chunk:
            chunks.append(current_chunk)

        chunks = _merge_small_sections(chunks, min_section_chars)

    final_chunks = []
    final_index = 0

    for chunk in chunks:
        section_text = " ".join(chunk["content"]).strip()

        if not section_text:
            final_index += 1
            final_chunks.append(
                {
                    **chunk,
                    "chunk_id": f"{document_id}_{final_index}",
                    "content": [],
                }
            )
            continue

        parts = _split_text_with_overlap(section_text, chunk_size, chunk_overlap)
        for part in parts:
            final_index += 1
            final_chunks.append(
                {
                    **chunk,
                    "chunk_id": f"{document_id}_{final_index}",
                    "content": [part],
                }
            )

    return final_chunks

def merge_empty_parent_chunks(chunks):
    merged = []
    i = 0

    while i < len(chunks):
        chunk = chunks[i]

        # ❗ DO NOT MERGE DOCUMENT TITLE
        if chunk["section_level"] == 0:
            merged.append(chunk)
            i += 1
            continue

        # Merge only empty non-root headings
        if not chunk["content"]:
            j = i + 1
            while (
                j < len(chunks)
                and chunks[j]["section_level"] > chunk["section_level"]
            ):
                chunk["content"].extend(chunks[j]["content"])
                j += 1

            merged.append(chunk)
            i = j
        else:
            merged.append(chunk)
            i += 1

    return merged
