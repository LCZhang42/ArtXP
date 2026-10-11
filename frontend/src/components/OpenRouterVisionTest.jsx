import { useState } from 'react';
import { ExternalLink, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

import { testOpenRouterVision } from '../api/client';

const DEFAULT_MODEL = 'google/gemini-3.8-flash';

export default function OpenRouterVisionTest() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  async function runTest() {
    if (!apiKey.trim() || !image) return;
    setTesting(true);
    setError('');
    setResult(null);
    try {
      setResult(await testOpenRouterVision({ apiKey, model, image }));
    } catch (requestError) {
      setError(requestError.message || 'OpenRouter vision test failed.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-violet-900/50 rounded-2xl p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
            Phase 2 · OpenRouter vision test
          </h2>
          <a
            href="https://openrouter.ai/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            Get a key <ExternalLink size={10} />
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Sends one image through FastAPI directly to OpenRouter. The key, image, and result stay in memory and are not saved by ArtXP.
        </p>
      </div>

      <div>
        <label className="text-xs text-slate-400">OpenRouter API key</label>
        <div className="flex gap-2 mt-1">
          <input
            type={showKey ? 'text' : 'password'}
            autoComplete="off"
            value={apiKey}
            onChange={event => setApiKey(event.target.value)}
            placeholder="sk-or-v1-..."
            className="min-w-0 flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(value => !value)}
            aria-label={showKey ? 'Hide OpenRouter key' : 'Show OpenRouter key'}
            className="px-3 text-slate-500 hover:text-slate-300"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">Vision model</label>
        <input
          value={model}
          onChange={event => setModel(event.target.value)}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500"
        />
      </div>

      <label className="flex items-center gap-3 bg-slate-800 border border-dashed border-slate-700 hover:border-violet-600 rounded-xl p-3 cursor-pointer">
        <ImageIcon size={18} className="text-violet-400" />
        <span className="text-sm text-slate-300 truncate">
          {image ? image.name : 'Choose a JPEG, PNG, or WebP image (max 8 MB)'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={event => setImage(event.target.files?.[0] || null)}
        />
      </label>

      <button
        type="button"
        onClick={runTest}
        disabled={testing || !apiKey.trim() || !image}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-600 text-white py-2.5 rounded-xl font-semibold text-sm"
      >
        {testing ? 'Testing vision…' : 'Run isolated vision test'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {result && (
        <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-4 space-y-3">
          <div className="flex justify-between gap-3 text-xs">
            <span className="text-emerald-400">Connection succeeded</span>
            <span className="text-slate-500">{result.latency_ms} ms</span>
          </div>
          <p className="text-sm text-slate-200">{result.analysis.summary}</p>
          <ul className="space-y-2">
            {result.analysis.observations.map((item, index) => (
              <li key={`${item.area}-${index}`} className="text-xs text-slate-400">
                <span className="text-violet-400 capitalize">{item.area}</span>
                {' · '}{item.observation} ({Math.round(item.confidence * 100)}%)
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-600 break-all">
            Model: {result.model}
            {typeof result.usage.cost === 'number' && ` · Cost: $${result.usage.cost.toFixed(6)}`}
            {typeof result.usage.total_tokens === 'number' && ` · Tokens: ${result.usage.total_tokens}`}
            {' · Not persisted'}
          </p>
        </div>
      )}
    </div>
  );
}
