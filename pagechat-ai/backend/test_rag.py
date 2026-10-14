from llm_factory import create_chat_model
from rag import answer_question

page_content = """
Retrieval-Augmented Generation (RAG) combines information retrieval
with a language model. First, documents are divided into chunks.
The system retrieves relevant chunks for a user's question and
provides them as context to the language model. This can help
ground answers in source material and reduce unsupported claims.
"""

chat_model = create_chat_model(
    provider="ollama",
    model="qwen2.5:3b",
)

result = answer_question(
    chat_model=chat_model,
    page_content=page_content,
    question="How does RAG work?",
)

print("Answer:")
print(result["answer"])

print("\nSources:")
for source in result["sources"]:
    print(source["content"])
