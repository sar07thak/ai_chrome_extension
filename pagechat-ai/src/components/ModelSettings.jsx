import { useState } from "react";

const PROVIDERS = {
  ollama: {
    label: "Ollama",
    defaultModel: "qwen2.5:3b",
    help: "Runs locally. Make sure Ollama is installed and running.",
    requiresApiKey: false,
  },
  anthropic: {
    label: "Anthropic Claude",
    defaultModel: "claude-sonnet-4-5",
    placeholder: "sk-ant-...",
    help: "Get your key from console.anthropic.com",
    requiresApiKey: true,
  },
  groq: {
    label: "Groq",
    defaultModel: "",
    placeholder: "gsk_...",
    help: "Get your key from console.groq.com",
    requiresApiKey: true,
  },
};

export default function ModelSettings({ onSave }) {
  const [provider, setProvider] = useState("ollama");
  const [model, setModel] = useState(
    PROVIDERS.ollama.defaultModel
  );
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const selected = PROVIDERS[provider];

  function changeProvider(value) {
    setProvider(value);
    setModel(PROVIDERS[value].defaultModel);
    setApiKey("");
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!model.trim()) {
      setError("Please enter a model ID.");
      return;
    }

    if (selected.requiresApiKey && !apiKey.trim()) {
      setError("Please enter your API key.");
      return;
    }

    // Pass settings to the parent component.
    // Do not persist the API key in browser storage.
    onSave({
      provider,
      model: model.trim(),
      apiKey: selected.requiresApiKey ? apiKey.trim() : "",
    });

    // Clear the key from the input after saving.
    setApiKey("");
    setShowKey(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-100"
    >
      <div>
        <h2 className="text-lg font-semibold">
          Model settings
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {provider === "ollama"
            ? "Chat locally without a cloud API key."
            : "Use your own provider API key."}
        </p>
      </div>

      <div>
        <label
          htmlFor="provider"
          className="mb-2 block text-sm font-medium"
        >
          Provider
        </label>

        <select
          id="provider"
          value={provider}
          onChange={(event) =>
            changeProvider(event.target.value)
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
        >
          {Object.entries(PROVIDERS).map(([value, details]) => (
            <option key={value} value={value}>
              {details.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="model"
          className="mb-2 block text-sm font-medium"
        >
          Model ID
        </label>

        <input
          id="model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder="Enter the provider's model ID"
          autoComplete="off"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
        />

        <p className="mt-2 text-xs leading-5 text-slate-400">
          {selected.help}
        </p>
      </div>

      {selected.requiresApiKey && (
        <div>
          <label
            htmlFor="apiKey"
            className="mb-2 block text-sm font-medium"
          >
            API key
          </label>

          <input
            id="apiKey"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={selected.placeholder}
            autoComplete="off"
            spellCheck={false}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
          />

          <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showKey}
              onChange={(event) =>
                setShowKey(event.target.checked)
              }
              className="accent-blue-500"
            />
            Show API key
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
      >
        Use this model
      </button>

      <p className="text-xs leading-5 text-slate-400">
        API keys are not saved by this component. Cloud requests
        send your key to the configured backend for authentication.
      </p>
    </form>
  );
}