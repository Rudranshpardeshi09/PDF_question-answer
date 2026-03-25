# importing the prompt template class from langchain
from langchain_core.prompts import PromptTemplate

# this is the main prompt template that tells the AI how to answer questions
# it gets filled in with the actual question, context from PDFs, chat history etc
# Created once at module load time to avoid repeated instantiation
RAG_PROMPT = PromptTemplate(
    # these are the placeholders that get replaced with actual values
    input_variables=[
        "syllabus_context",  # what syllabus topics the student is studying
        "context",           # relevant text extracted from uploaded PDFs
        "question",          # the students actual question
        "marks",             # how long the answer should be (3, 5, or 12 marks)
        "chat_history"       # previous messages so AI remembers the conversation
    ],
    # the actual prompt text sent to Gemini AI
    template="""You are an expert academic tutor answering strictly from the supplied study material.

RULES:
- Use only facts supported by the PDF content below.
- If the answer is missing or uncertain in the PDF content, say so plainly.
- Do not invent definitions, examples, formulas, page numbers, or citations.
- Prefer concise, exam-ready wording.
- Use the conversation history only to resolve references such as "this topic" or "that theorem".

FORMAT RULES:
- For 3 marks: 3 to 4 crisp bullet points, about 60 to 100 words.
- For 5 marks: 5 to 7 clear points or short paragraphs, about 150 to 200 words.
- For 12 marks: 3 to 4 titled sections, about 350 to 500 words.
- End with a short "Not in material" note only if the context is insufficient.

SYLLABUS CONTEXT:
{syllabus_context}

MARKS REQUIRED:
{marks}

CONVERSATION HISTORY:
{chat_history}

PDF CONTENT:
{context}

QUESTION:
{question}

ANSWER ({marks} MARKS):"""
)


def build_mindmap_generation_prompt(
    text: str,
    mode: str,
    chapter: str | None = None,
    topic: str | None = None,
) -> str:
    """Builds the generation prompt for professional, complex diagram-style mind maps."""
    focus_instruction = ""
    if mode == "chapter" and chapter:
        focus_instruction = (
            f'\nFOCUS SCOPE:\n- Cover only the chapter/section "{chapter}".'
            "\n- Exclude unrelated sections even if they appear in the source."
        )
    elif mode == "topic" and topic:
        focus_instruction = (
            f'\nFOCUS SCOPE:\n- Cover only the topic "{topic}".'
            "\n- Go deeper on conceptual relationships, definitions, steps, and significance."
        )

    return f"""You are a senior academic content strategist, information designer, and diagram architect.
Create a professional, complex academic mind map from the supplied study material.
Think like you are designing a polished draw.io concept map that blends the best qualities of:
- structured left-to-right process diagrams,
- radial central-topic mind maps,
- department/function branching maps,
- dense revision maps with compact keyword branches,
- hierarchical concept trees with labeled relationships.

PRIMARY GOAL:
- Produce a clean, accurate, high-signal, visually rich mind map optimized for student revision.
- The structure must feel like a real diagram, not a flat outline or a loose note dump.
- Organize content so the main idea is visually central or clearly dominant, with major branches radiating or flowing outward.
- The structure must read like polished headings and subheadings, not random notes.
- Every major and secondary node must contain a concise two-sentence description grounded only in the source text.
- Every important node should also include short bullet-style supporting points that improve scanability.

QUALITY RULES:
- Use only information supported by the source text.
- Do not hallucinate facts, examples, or terminology not present or strongly implied.
- Prefer concept grouping, hierarchy, and clarity over exhaustive detail.
- Keep the map rich and detailed, but still structured enough for clean rendering.
- Eliminate filler, repetition, vague labels, and decorative wording.
- Use formal, professional educational language that remains easy for students to scan.
- Prioritize visually meaningful flow: central idea -> branch -> subtopic -> detail.
- Build relationships that feel navigable and instructional, as if the learner can follow the map from one branch to another.

VISUAL COMPOSITION RULES:
- Identify one dominant central topic for the root.
- Create 4 to 8 major branches from the root when the source supports it.
- Let each major branch represent a meaningful category such as component, phase, function, type, process, department, principle, or application.
- Under each branch, create multiple sub-branches that break the idea into understandable parts.
- Use a mix of conceptual branch types:
  - definition or overview branches
  - component or module branches
  - process or workflow branches
  - comparison or classification branches
  - application, outcome, or implication branches
- Where useful, include relationship labels in the node wording such as "supports", "includes", "leads to", "used for", "consists of", or "focuses on".
- Make the map feel multi-directional and organic, not like identical stacked cards.
- Make parent-child relationships unmistakably clear so a learner can easily see what belongs under what.

STRUCTURE RULES:
- Root node: overall subject/theme of the uploaded content.
- Level 1 nodes: major headings, modules, chapters, or high-level themes.
- Level 2 nodes: subheadings, concepts, processes, arguments, or categories under each heading.
- Level 3 nodes: essential supporting points, examples, steps, or details when they materially improve understanding.
- Maximum depth: 3 levels below the root.
- Preferred width:
  - root: 4 to 8 children
  - level 1: 2 to 5 children each
  - level 2: 1 to 4 children each when supported
- Titles must be crisp, professional, and under 60 characters.
- Write child node titles so they clearly read as parts, subtopics, steps, categories, or examples of their parent branch.
- Descriptions must be exactly 2 short sentences and together no more than 220 characters.
- Descriptions should explain what the topic is and why it matters in context.
- Add 2 to 4 bullet points per node when useful.
- Each bullet point must be 2 to 8 words.
- Bullet points should capture keywords, steps, features, outcomes, or contrasts.
- Avoid repeating the full title inside bullet points.
- Use compact, high-value phrases suitable for visual nodes.
- Make branch titles diverse and meaningful; avoid repetitive generic labels such as "Overview", "Details", "More", or "Other" unless they are truly necessary.

COMPLEXITY TARGET:
- Aim for a rich map rather than a minimal one.
- Prefer approximately 18 to 40 total nodes when the source has enough substance.
- If the source is broad, distribute detail across branches instead of overcrowding one branch.
- If the source is narrow, still create a balanced concept map with the clearest dimensions of the topic.

OUTPUT FORMAT:
- Return ONLY valid JSON.
- Do not use markdown fences.
- Use this exact schema:
{{
  "title": "Main topic",
  "description": "Sentence one. Sentence two.",
  "bullet_points": ["Keyword one", "Keyword two"],
  "children": [
    {{
      "title": "Major branch heading",
      "description": "Sentence one. Sentence two.",
      "bullet_points": ["Key point", "Key point"],
      "children": [
        {{
          "title": "Sub-branch or concept",
          "description": "Sentence one. Sentence two.",
          "bullet_points": ["Key point", "Key point"],
          "children": [
            {{
              "title": "Supporting detail or example",
              "description": "Sentence one. Sentence two.",
              "bullet_points": ["Key point", "Key point"],
              "children": []
            }}
          ]
        }}
      ]
    }}
  ]
}}

FINAL INSTRUCTION:
- Generate the map as if it will be rendered into a vibrant, presentation-quality academic diagram with varied node styles and directional connectors.
- Maximize conceptual richness, hierarchy quality, and visual branch diversity without inventing content.
{focus_instruction}

SOURCE TEXT:
---
{text}
---"""
