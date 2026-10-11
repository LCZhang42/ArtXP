import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Image, Search, ExternalLink, X, AlertCircle, Bookmark, Trash2 } from 'lucide-react';
import { searchReferences, buildReferenceQuery } from '../utils/pixabay';

const QUICK_SEARCHES = [
  'person full body standing neutral pose',
  'human hands fingers posed close-up',
  'cat sitting standing lying various poses',
  'human face portrait expressions neutral',
  'dramatic studio portrait side lighting',
  'architecture street depth vanishing point',
  'animal full body natural pose',
  'fabric cloth folds draped',
];

export default function ReferenceFinder() {
  const { user, settings, savedRefs, addSavedRef, removeSavedRef } = useApp();
  const [query, setQuery]         = useState('');
  const [refs, setRefs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [searched, setSearched]   = useState(false);
  const [similar, setSimilar]     = useState({ loading: false, data: null });
  const [tab, setTab]             = useState('search'); // 'search' | 'saved'

  useEffect(() => {
    if (!selected || !settings.pixabayKey) {
      setSimilar({ loading: false, data: null });
      return;
    }
    const q = selected.description.split(',').slice(0, 3).map(t => t.trim()).join(' ');
    setSimilar({ loading: true, data: null });
    searchReferences(settings.pixabayKey, q, 7)
      .then(data => setSimilar({ loading: false, data: data.filter(p => p.id !== selected.id).slice(0, 6) }))
      .catch(() => setSimilar({ loading: false, data: [] }));
  }, [selected, settings.pixabayKey]);

  const goalQuery = user?.goal
    ? buildReferenceQuery(user.goal, 'gesture')
    : null;

  const suggestions = [
    goalQuery,
    ...QUICK_SEARCHES,
  ].filter(Boolean);

  async function doSearch(q) {
    const term = (q || query).trim();
    if (!term) return;
    if (!settings.pixabayKey) {
      setError('Add your Pixabay API key in Settings to search references.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const results = await searchReferences(settings.pixabayKey, term, 12);
      setRefs(results);
      if (results.length === 0) setError('No results found. Try a different search term.');
    } catch (e) {
      setError(e.message);
      setRefs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(s) {
    setQuery(s);
    doSearch(s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Image size={22} className="text-violet-400" />
            Reference Finder
          </h1>
          <p className="text-slate-400 text-sm mt-1">Find art references for your current practice</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 flex-shrink-0">
          <button
            onClick={() => setTab('search')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'search' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === 'saved' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark size={13} fill={tab === 'saved' ? 'currentColor' : 'none'} />
            Saved{savedRefs.length > 0 && <span className="text-xs opacity-75">({savedRefs.length})</span>}
          </button>
        </div>
      </div>

      {tab === 'search' && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 focus-within:border-violet-600 rounded-xl px-4 py-2.5 transition-colors">
              <Search size={15} className="text-slate-600 flex-shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search references (e.g. cat gesture, hands, portraits…)"
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => doSearch()}
              disabled={loading || !query.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 8).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-full transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-900/40 rounded-xl p-3">
              <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-2xl aspect-video animate-pulse" />
              ))}
            </div>
          )}

          {!loading && refs.length > 0 && (
            <>
              <p className="text-xs text-slate-600">{refs.length} references found</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {refs.map(ref => (
                  <button
                    key={ref.id}
                    onClick={() => setSelected(ref)}
                    className="group relative bg-slate-800 rounded-2xl overflow-hidden aspect-video hover:ring-2 hover:ring-violet-500/70 transition-all focus:outline-none"
                  >
                    <img
                      src={ref.smallUrl}
                      alt={ref.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-white text-xs line-clamp-2 text-left leading-tight">{ref.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-700 text-center">
                Images from{' '}
                <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">Pixabay</a>
              </p>
            </>
          )}

          {!loading && !searched && refs.length === 0 && !error && (
            <div className="text-center py-16">
              <Image size={40} className="text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 text-sm">Search or pick a suggestion above to find references</p>
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {savedRefs.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark size={40} className="text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 text-sm">No saved references yet</p>
              <p className="text-slate-700 text-xs mt-1">Press the bookmark icon inside any image to save it</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {savedRefs.map(ref => (
                <div key={ref.id} className="group relative bg-slate-800 rounded-2xl overflow-hidden aspect-video">
                  <img
                    src={ref.smallUrl}
                    alt={ref.description}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    onClick={() => setSelected(ref)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                    {ref.context && <span className="text-violet-300 text-xs font-medium truncate">{ref.context}</span>}
                    <span className="text-white text-xs line-clamp-1 leading-tight">{ref.description}</span>
                  </div>
                  <button
                    onClick={() => removeSavedRef(ref.id)}
                    title="Remove from saved"
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{selected.description}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Photo by{' '}
                  <a
                    href={selected.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {selected.author}
                  </a>
                  {' '}on Pixabay
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {(() => {
                  const isSaved = savedRefs.some(r => r.id === selected.id);
                  return (
                    <button
                      onClick={() => isSaved ? removeSavedRef(selected.id) : addSavedRef(selected, query || '')}
                      title={isSaved ? 'Remove from saved' : 'Save reference'}
                      className={`transition-colors p-1 ${isSaved ? 'text-violet-400 hover:text-violet-300' : 'text-slate-400 hover:text-violet-400'}`}
                    >
                      <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  );
                })()}
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
            <img
              src={selected.url}
              alt={selected.description}
              className="w-full max-h-[55vh] object-contain bg-slate-950"
            />
            {(similar.loading || similar.data?.length > 0) && (
              <div className="px-4 py-3 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Similar images</p>
                {similar.loading ? (
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-28 rounded-lg bg-slate-800 animate-pulse" style={{ height: '72px' }} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {similar.data.map(photo => (
                      <button
                        key={photo.id}
                        onClick={() => setSelected(photo)}
                        className="flex-shrink-0 w-28 rounded-lg overflow-hidden bg-slate-800 hover:ring-2 hover:ring-violet-500/60 transition-all"
                        style={{ height: '72px' }}
                      >
                        <img src={photo.thumbUrl} alt={photo.description} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
