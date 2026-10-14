from llm_factory import create_chat_model

chat_model = create_chat_model(
    provider="ollama",
    model="qwen2.5:3b",
)

response = chat_model.invoke("Explain RAG in two sentences.")

print(response.content)