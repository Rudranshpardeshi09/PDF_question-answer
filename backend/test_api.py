import os
import sys
import json
import re
import traceback

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.mindmap_service import _get_uploaded_file_path, _load_text_from_file
from app.services.gemini_llm import generate_text

def test():
    filename = "unit 1.pdf"
    log_file = os.path.join(os.path.dirname(__file__), "debug_llm.log")
    
    with open(log_file, "w") as f:
        f.write(f"Loading {filename}...\n")
        try:
            filepath = _get_uploaded_file_path(filename)
            text = _load_text_from_file(filepath)
            text_for_structure = text[:8000]
            
            prompt = f"""Analyze this document text and extract its hierarchical structure.

Identify the main chapters/sections and their topics/subtopics.

Document text:
---
{text_for_structure}
---

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "chapters": [
    {{
      "name": "Chapter or section name",
      "topics": [
        {{"name": "Topic name"}},
        {{"name": "Another topic"}}
      ]
    }}
  ]
}}

Rules:
- Extract real chapter/section names from the document
- Each chapter should have 2-8 topics
- If the document has no clear chapters, create logical groupings from the content
- Keep names concise (max 60 characters each)
- Return at least 2 chapters and at most 10
"""
            f.write("Calling LLM...\n")
            response = generate_text(prompt, temperature=0.1, max_tokens=8192, response_mime_type="application/json")
            
            f.write("\n--- RAW LLM RESPONSE ---\n")
            f.write(response)
            f.write("\n------------------------\n")
            
            json_match = re.search(r'\{[\s\S]*\}', response)
            if not json_match:
                f.write("REGEX FAILED TO FIND JSON.\n")
                return
                
            json_str = json_match.group()
            
            try:
                structure = json.loads(json_str)
                f.write("SUCCESSFULLY PARSED JSON!\n")
            except json.JSONDecodeError as e:
                f.write(f"JSONDECODEERROR: {e}\n")
                
        except Exception as e:
            f.write("EXCEPTION CAUGHT:\n")
            f.write(traceback.format_exc())

if __name__ == "__main__":
    test()
