import { useState } from "react";
import ModelSettings from "./components/ModelSettings";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function App() {
  const [page, setPage] = useState(null);
  const [settings, setSettings] = useState({
    provider: "ollama",
    model: "qwen2.5:3b",
    apiKey: "",
  });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState("");

  
async function loadCurrentPage() {
  setLoadingPage(true);
  setError("");
  setAnswer("");
  setSources([]);
  setPage(null);

  try {
    if (!chrome?.tabs || !chrome?.scripting) {
      throw new Error(
        "Chrome extension APIs are unavailable. Open PageChat AI in Chrome."
      );
    }

    // Get the active tab in the current Chrome window.
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    
    const activeTab = tabs[0];
    
    if (!activeTab?.id || !activeTab.url) {
      throw new Error(
        "Could not identify the active webpage. Switch to the website tab and try again."
      );
    }
    
    if (!/^https?:\/\//i.test(activeTab.url)) {
      throw new Error("Open a regular HTTP or HTTPS website.");
    }

    // Extract text from the selected webpage.
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => ({
        title: document.title,
        url: window.location.href,
        content: document.body?.innerText || "",
      }),
    });

    const extracted = results?.[0]?.result;

    if (!extracted?.content?.trim()) {
      throw new Error(
        "The webpage opened, but no readable text was found."
      );
    }

    setPage({
      title: extracted.title || "Untitled page",
      url: extracted.url,
      content: extracted.content.slice(0, 100000),
    });
  } catch (err) {
    console.error("PageChat extraction error:", err);
    setError(err.message || "Failed to extract webpage content.");
  } finally {
    setLoadingPage(false);
  }
}


  async function askQuestion(event) {
    event.preventDefault();

    if (!page) {
      setError("Load a webpage before asking a question.");
      return;
    }

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (
      settings.provider !== "ollama" &&
      !settings.apiKey?.trim()
    ) {
      setError(
        `Please configure your ${settings.provider} API key in Model Settings.`
      );
      return;
    }

    setLoadingAnswer(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          api_key: settings.apiKey || null,
          question: question.trim(),
          page_content: page.content,
          top_k: 4,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "The backend could not answer your question."
        );
      }

      setAnswer(
        typeof data.answer === "string"
          ? data.answer
          : JSON.stringify(data.answer)
      );

      setSources(data.sources || []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to contact the backend. Make sure FastAPI is running."
      );
    } finally {
      setLoadingAnswer(false);
    }
  }

  function handleSettingsSave(newSettings) {
    setSettings({
      provider: newSettings.provider,
      model: newSettings.model,
      apiKey: newSettings.apiKey || "",
    });

    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              PageChat AI
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Chat with the webpage you are reading.
            </p>
          </div>

          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {settings.provider}
          </span>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Current webpage</h2>

            <button
              type="button"
              onClick={loadCurrentPage}
              disabled={loadingPage}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPage
                ? "Reading..."
                : page
                  ? "Refresh page"
                  : "Load page"}
            </button>
          </div>

          {page ? (
            <div className="space-y-2">
              <p className="font-medium text-slate-100">
                {page.title}
              </p>

              <p className="break-all text-xs text-slate-400">
                {page.url}
              </p>

              <p className="text-xs text-emerald-400">
                Webpage content loaded successfully.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Load the active browser tab to start asking questions.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Model settings</h2>

          <ModelSettings onSave={handleSettingsSave} />

          <p className="mt-3 text-xs text-slate-500">
            Cloud providers require your own API key. Ollama uses a
            locally running model.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Ask this page</h2>

          <form onSubmit={askQuestion} className="space-y-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Summarize this page, explain a concept, or ask a question..."
              rows={4}
              maxLength={5000}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={!page || loadingAnswer || !question.trim()}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingAnswer ? "Thinking..." : "Ask PageChat AI"}
            </button>
          </form>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {answer && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-3 font-semibold">Answer</h2>

            <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
              {answer}
            </div>

            {sources.length > 0 && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-300">
                  Relevant webpage passages
                </h3>

                <div className="space-y-3">
                  {sources.map((source, index) => (
                    <details
                      key={`${source.chunk ?? index}-${index}`}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <summary className="cursor-pointer text-sm font-medium text-indigo-300">
                        Source chunk {source.chunk ?? index + 1}
                      </summary>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                        {source.content}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="pb-3 text-center text-xs text-slate-600">
          PageChat AI · Your page, your questions, your model.
        </footer>
      </div>
    </main>
  );
}