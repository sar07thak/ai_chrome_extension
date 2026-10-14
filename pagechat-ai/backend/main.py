from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from llm_factory import create_chat_model
from rag import answer_question


app = FastAPI(title="PageChat AI API")


# ---------- Request models ----------

class LoadURLRequest(BaseModel):
    url: HttpUrl


class ChatRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=30)
    model: str = Field(min_length=1, max_length=150)
    question: str = Field(min_length=1, max_length=5000)
    page_content: str = Field(min_length=1, max_length=100_000)
    api_key: str | None = Field(default=None, max_length=500)
    top_k: int = Field(default=4, ge=1, le=8)


# ---------- Basic endpoints ----------

@app.get("/")
def root():
    return {"message": "PageChat AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- Load webpage ----------

@app.post("/load-url")
def load_url(request: LoadURLRequest):
    try:
        loader = WebBaseLoader(
            web_path=str(request.url),
            requests_kwargs={"timeout": 15},
        )

        documents = loader.load()

        if not documents:
            raise HTTPException(
                status_code=422,
                detail="No content found on this webpage.",
            )

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
        )

        chunks = splitter.split_documents(documents)

        return {
            "url": str(request.url),
            "title": documents[0].metadata.get("title", ""),
            "document_count": len(documents),
            "chunk_count": len(chunks),
            "content": documents[0].page_content,
            "chunks": [chunk.page_content for chunk in chunks],
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Page loading error: {type(exc).__name__}")

        raise HTTPException(
            status_code=502,
            detail="Unable to load this webpage.",
        )


# ---------- Chat endpoint ----------

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        chat_model = create_chat_model(
            provider=request.provider,
            model=request.model,
            api_key=request.api_key,
        )

        result = answer_question(
            chat_model=chat_model,
            page_content=request.page_content,
            question=request.question,
            top_k=request.top_k,
        )

        return {
            "provider": request.provider.strip().lower(),
            "model": request.model.strip(),
            "answer": result["answer"],
            "sources": result["sources"],
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        # Never log the request body or API key.
        print(f"Chat request failed: {type(exc).__name__}")

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to generate an answer. Check the selected "
                "model, provider configuration, and model availability."
            ),
        )