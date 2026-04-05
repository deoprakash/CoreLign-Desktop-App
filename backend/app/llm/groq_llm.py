from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
import  os
from dotenv import load_dotenv

load_dotenv()


def _safe_float(value, default):
    try:
        return float(value)
    except Exception:
        return float(default)


def _safe_int(value, default):
    try:
        return int(value)
    except Exception:
        return int(default)

class GroqLLM:
    def __init__(self):
        self.default_model = "llama-3.1-8b-instant"
        self.allowed_models = {
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile",
            "mixtral-8x7b-32768",
            "deepseek-r1-distill-llama-70b",
            "deepseek-r1-distill-qwen-32b",
            "openai/gpt-oss-20b",
            "openai/gpt-oss-120b",
            "gemma2-9b-it",
            "qwen/qwen3-32b",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "meta-llama/llama-4-maverick-17b-128e-instruct",
        }

    def _select_model(self, question: str, generation: dict | None):
        generation = generation or {}
        mode = str(generation.get("mode") or "auto").lower()
        requested_model = str(generation.get("model") or self.default_model).strip()

        if mode == "manual":
            return requested_model if requested_model in self.allowed_models else self.default_model

        # Auto mode: pick larger model for longer/complex prompts.
        q = (question or "").strip().lower()
        complexity_markers = [
            "analyze", "compare", "difference", "tradeoff", "reason", "why", "how", "summarize",
            "multi", "step", "impact", "explain in detail", "architecture", "evaluate",
        ]
        is_complex = len(q) > 140 or any(token in q for token in complexity_markers)
        return "llama-3.3-70b-versatile" if is_complex else "llama-3.1-8b-instant"

    def _build_llm(self, question: str, generation: dict | None):
        resolved = self.resolve_generation_config(question, generation)

        return ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name=resolved["model"],
            temperature=resolved["temperature"],
            max_tokens=resolved["max_tokens"],
        )

    def resolve_generation_config(self, question: str, generation: dict | None = None) -> dict:
        generation = generation or {}
        return {
            "mode": str(generation.get("mode") or "auto").lower(),
            "model": self._select_model(question, generation),
            "temperature": max(0.0, min(1.0, _safe_float(generation.get("temperature", 0.2), 0.2))),
            "max_tokens": max(64, min(4096, _safe_int(generation.get("maxTokens", 700), 700))),
        }
    
    def generate_answer(self, context: str, question: str, generation: dict | None = None) -> str:
        if not context or not context.strip():
            return "I don't have enough information in the provided context to answer that."

#         prompt = f"""
# You are an intelligent document assistant. Use only the provided context.

# If the answer is not explicitly in the context, reply exactly with:
# "I don't have enough information in the provided context to answer that."

# Context:
# {context}

# Question:
# {question}

# Answer concisely and factually based only on the context.
# """

        prompt = f"""

You are an intelligent document assistant. Use ONLY the provided context.

STRICT RULES:

* Do NOT use prior knowledge.
* Do NOT guess or assume.
* If the answer is not explicitly in the context, reply EXACTLY:
  "I don't have enough information in the provided context to answer that."

YES/NO RULES:

* For yes/no questions, answer directly with "Yes" or "No" first.
* If context explicitly states a different value than the one asked in the question,
    answer "No" and provide the correct value from context.
* Treat statements like "X was considered but rejected" as explicit evidence that X is not the final choice.

ANSWERING INSTRUCTIONS:

* Extract ALL relevant information from the context.
* If the answer contains multiple items, list ALL of them clearly.
* Do NOT give partial answers.
* Keep the answer COMPLETE.

Context:
{context}

Question:
{question}

Answer:

"""

        msg = HumanMessage(content=prompt)

        # langchain_groq ChatGroq is a LangChain Runnable; call via invoke()
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            print("DEBUG: GROQ_API_KEY is missing; skipping LLM call")
            return ""

        llm = self._build_llm(question=question, generation=generation)

        response = None
        last_error = None
        for call_style in ("invoke_messages", "invoke_text", "generate_messages"):
            try:
                if call_style == "invoke_messages" and hasattr(llm, "invoke"):
                    print("DEBUG: Calling Groq LLM via invoke([HumanMessage])")
                    response = llm.invoke([msg])
                    break

                if call_style == "invoke_text" and hasattr(llm, "invoke"):
                    print("DEBUG: Calling Groq LLM via invoke(prompt_str)")
                    response = llm.invoke(msg.content)
                    break

                if call_style == "generate_messages" and hasattr(llm, "generate"):
                    print("DEBUG: Calling Groq LLM via generate([[HumanMessage]])")
                    response = llm.generate([[msg]])
                    break
            except Exception as e:
                last_error = e
                response = None

        # Fallback to default model if the chosen model is unavailable.
        if response is None:
            try:
                fallback_llm = ChatGroq(
                    api_key=os.getenv("GROQ_API_KEY"),
                    model_name=self.default_model,
                    temperature=0.2,
                    max_tokens=700,
                )
                if hasattr(fallback_llm, "invoke"):
                    response = fallback_llm.invoke([msg])
            except Exception as e:
                last_error = e

        if response is None:
            print(f"DEBUG: Groq LLM call failed: {type(last_error).__name__}: {last_error}")
            return ""

        # Extract text/content from various possible response shapes
        def _extract_text(res):
            if res is None:
                return ""
            if isinstance(res, str):
                return res
            if hasattr(res, "content"):
                return getattr(res, "content")
            # langchain generations object
            if hasattr(res, "generations"):
                try:
                    gens = getattr(res, "generations")
                    if gens and gens[0] and gens[0][0]:
                        g0 = gens[0][0]
                        if hasattr(g0, "text"):
                            return getattr(g0, "text")
                        if hasattr(g0, "message") and hasattr(getattr(g0, "message"), "content"):
                            return getattr(getattr(g0, "message"), "content")
                except Exception:
                    pass
            if isinstance(res, (list, tuple)) and len(res) > 0:
                first = res[0]
                if isinstance(first, str):
                    return first
                if hasattr(first, "content"):
                    return getattr(first, "content")
                if isinstance(first, dict):
                    for k in ("content", "text", "answer"):
                        if k in first:
                            return first[k]
            if isinstance(res, dict):
                for k in ("content", "text", "answer", "result"):
                    if k in res:
                        return res[k]
            return str(res)

        return _extract_text(response)