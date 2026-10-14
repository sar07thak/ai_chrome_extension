from langchain_core.language_models.chat_models import BaseChatModel
from langchain_anthropic import ChatAnthropic
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama


def create_chat_model(
    provider: str,
    model: str,
    api_key: str | None = None,
    base_url: str = "http://127.0.0.1:11434",
    temperature: float = 0.2,
) -> BaseChatModel:
    """
    Create a LangChain chat model for Anthropic, Groq, or Ollama.

    Args:
        provider: Selected provider (anthropic, groq, or ollama).
        model: Model identifier selected by the user.
        api_key: Required for Anthropic and Groq; not required for Ollama.
        base_url: Ollama server URL.
        temperature: Controls response randomness.

    Returns:
        A configured LangChain chat model.
    """

    provider = provider.strip().lower()
    model = model.strip()

    if not model:
        raise ValueError("Model name cannot be empty.")

    if not 0 <= temperature <= 2:
        raise ValueError("Temperature must be between 0 and 2.")

    if provider == "anthropic":
        if not api_key or not api_key.strip():
            raise ValueError("An Anthropic API key is required.")

        return ChatAnthropic(
            model=model,
            api_key=api_key.strip(),
            temperature=temperature,
        )

    elif provider == "groq":
        if not api_key or not api_key.strip():
            raise ValueError("A Groq API key is required.")

        return ChatGroq(
            model=model,
            api_key=api_key.strip(),
            temperature=temperature,
        )

    elif provider == "ollama":
        return ChatOllama(
            model=model,
            base_url=base_url,
            temperature=temperature,
        )

    else:
        raise ValueError(
            "Unsupported provider. Choose anthropic, groq, or ollama."
        )