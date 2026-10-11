import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Upload, X, Calendar, Flame, Image as ImageIcon, Plus } from 'lucide-react';

const SKILLS = ['gesture', 'anatomy', 'perspective', 'composition', 'lighting', 'linework'];

const SKILL_COLORS = {
  gesture:     'text-violet-400 border-violet-500/40 bg-violet-500/10',
  anatomy:     'text-pink-400 border-pink-500/40 bg-pink-500/10',
  perspective: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  composition: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  lighting:    'text-amber-400 border-amber-500/40 bg-amber-500/10',
  linework:    'text-orange-400 border-orange-500/40 bg-orange-500/10',
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PracticeLog() {
  const { practiceLog, addPracticeEntry, streak } = useApp();
  const fileRef = useRef();

  const [note, setNote]             = useState('');
  const [exercise, setExercise]     = useState('');
  const [skill, setSkill]           = useState('gesture');
  const [previewImg, setPreviewImg] = useState(null);
  const [imgData, setImgData]       = useState(null);
  const [viewEntry, setViewEntry]   = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPreviewImg(ev.target.result);
      setImgData(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    readFile(e.dataTransfer.files?.[0]);
  }

  function handleSubmit() {
    if (!imgData && !note.trim()) return;
    addPracticeEntry({ note, exercise, skill, image: imgData });
    setNote('');
    setExercise('');
    setPreviewImg(null);
    setImgData(null);
    setSkill('gesture');
  }

  const grouped = practiceLog.reduce((acc, entry) => {
    const key = new Date(entry.date).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const today = new Date().toDateString();
  const todayCount = (grouped[today] || []).length;

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={22} className="text-violet-400" />
            Practice Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track sketches · build your streak</p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 flex-shrink-0">
          <Flame size={18} className="text-orange-400" />
          <div>
            <div className="font-bold text-white text-xl leading-none">{streak.count}</div>
            <div className="text-xs text-slate-500 leading-none mt-0.5">day streak</div>
          </div>
        </div>
      </div>

      {todayCount > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-2xl px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          ✓ {todayCount} {todayCount === 1 ? 'entry' : 'entries'} logged today — keep it up!
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={16} className="text-violet-400" />
          Log Today's Practice
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !previewImg && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl mb-4 transition-all ${
            dragOver
              ? 'border-violet-500 bg-violet-500/5'
              : previewImg
              ? 'border-slate-700'
              : 'border-slate-800 hover:border-violet-700 cursor-pointer'
          }`}
        >
          {previewImg ? (
            <div className="relative">
              <img
                src={previewImg}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-2xl"
              />
              <button
                onClick={e => { e.stopPropagation(); setPreviewImg(null); setImgData(null); }}
                className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="py-10 text-center">
              <Upload size={22} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Drop your sketch here or click to upload</p>
              <p className="text-slate-700 text-xs mt-1">PNG · JPG · WEBP</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={e => readFile(e.target.files?.[0])}
          className="hidden"
        />

        <div className="space-y-3">
          <input
            value={exercise}
            onChange={e => setExercise(e.target.value)}
            placeholder="Exercise name (e.g. Cat gesture sketches)"
            className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 outline-none text-sm transition-colors"
          />

          <div className="flex gap-1.5 flex-wrap">
            {SKILLS.map(s => (
              <button
                key={s}
                onClick={() => setSkill(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize font-medium ${
                  skill === s
                    ? SKILL_COLORS[s]
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Notes, reflections, what you learned…"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 outline-none text-sm transition-colors resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={!imgData && !note.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            Save Entry · +30 XP
          </button>
        </div>
      </div>

      {practiceLog.length > 0 ? (
        <div className="space-y-6">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider text-slate-400">
            History · {practiceLog.length} {practiceLog.length === 1 ? 'entry' : 'entries'}
          </h2>
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={13} className="text-slate-600" />
                <span className="text-xs text-slate-500 font-medium">{date}</span>
                <span className="text-xs text-violet-400">· {entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setViewEntry(entry)}
                    className="bg-slate-900 border border-slate-800 hover:border-violet-700 rounded-2xl overflow-hidden text-left transition-all group"
                  >
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt="Sketch"
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-800 flex items-center justify-center">
                        <ImageIcon size={22} className="text-slate-700" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs text-slate-300 font-medium truncate">
                        {entry.exercise || 'Practice session'}
                      </p>
                      {entry.skill && (
                        <span className={`text-xs capitalize font-medium ${SKILL_COLORS[entry.skill]?.split(' ')[0] || 'text-slate-500'}`}>
                          {entry.skill}
                        </span>
                      )}
                      {entry.note && (
                        <p className="text-xs text-slate-600 truncate mt-0.5">{entry.note}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen size={36} className="text-slate-800 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">No practice logged yet.</p>
          <p className="text-slate-700 text-xs mt-1">Upload your first sketch above to start your journey!</p>
        </div>
      )}

      {viewEntry && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewEntry(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-white font-semibold text-sm">{viewEntry.exercise || 'Practice Entry'}</p>
                <p className="text-slate-500 text-xs mt-0.5">{formatDate(viewEntry.date)}</p>
              </div>
              <button onClick={() => setViewEntry(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            {viewEntry.image && (
              <img src={viewEntry.image} alt="Sketch" className="w-full max-h-80 object-contain bg-slate-950" />
            )}
            {(viewEntry.note || viewEntry.skill) && (
              <div className="p-4 space-y-2">
                {viewEntry.skill && (
                  <span className={`text-xs capitalize font-medium px-2 py-0.5 rounded-md border ${SKILL_COLORS[viewEntry.skill] || 'text-slate-400'}`}>
                    {viewEntry.skill}
                  </span>
                )}
                {viewEntry.note && <p className="text-slate-300 text-sm leading-relaxed">{viewEntry.note}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
