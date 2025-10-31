import React, { useState } from 'react';
import { AddressMapping } from "~/lib/storage/schema";

const COLOR_OPTIONS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

function EditPanel({
  address,
  mapping,
  onSave,
  onCancel,
}: {
  address: string;
  mapping: AddressMapping;
  onSave: (address: string, name: string, tags: string[], color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState<string>(mapping.name);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(mapping.tags || []);
  const [color, setColor] = useState<string>(mapping.color || '#3b82f6');

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleTagKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // noop
    }
  };

  const handleSave = () => onSave(address, name.trim(), tags, color);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-5 text-gray-200 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold leading-tight text-white">Edit Wallet</p>
            <p className="mt-1 text-sm text-gray-400">Modify the details for your wallet.</p>
          </div>
          <button 
            type="button" 
            onClick={handleSave} 
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h3a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h3v5.586l-1.293-1.293z"/>
              <path d="M9 2a1 1 0 011-1h2a1 1 0 011 1v4H9V2z"/>
            </svg>
            Save
          </button>
        </div>

        <div className="space-y-5">
          {/* Address */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Wallet Address</label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={`${address.slice(0,4)}...${address.slice(-4)}`}
                className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 font-mono text-sm text-gray-400 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button type="button" onClick={handleCopy} className="absolute right-3 text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a2 2 0 00-2 2v9a2 2 0 002 2h4a1 1 0 100-2H6V4h6v1a1 1 0 102 0V4a2 2 0 00-2-2H6z"/><path d="M13 7a2 2 0 00-2 2v7a2 2 0 002 2h3a2 2 0 002-2V9a2 2 0 00-2-2h-3zm0 2h3v7h-3V9z"/></svg>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Wallet Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Trading Wallet"
              className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Tags</label>
            <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 p-2">
              {tags.map((t) => (
                <span key={t} className="flex h-7 items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 text-indigo-300">
                  <span className="text-xs font-medium">{t}</span>
                  <button type="button" onClick={() => removeTag(t)} className="-mr-1 text-indigo-300/80 hover:text-indigo-200">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.646 4.646a.5.5 0 01.708 0L10 9.293l4.646-4.647a.5.5 0 11.708.708L10.707 10l4.647 4.646a.5.5 0 01-.708.708L10 10.707l-4.646 4.647a.5.5 0 01-.708-.708L9.293 10 4.646 5.354a.5.5 0 010-.708z" clipRule="evenodd"/></svg>
                  </button>
                </span>
              ))}
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length > 0 ? '' : 'Add a tag...'}
                className="form-input flex-1 min-w-[100px] border-none bg-transparent p-1 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Assign Color</label>
            <div className="grid grid-cols-7 gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="relative w-full rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white"
                  style={{ aspectRatio: '1 / 1', backgroundColor: c }}
                >
                  {color === c && (
                    <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-neutral-800 ring-white flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25A1 1 0 016.204 9l2.543 2.543 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPanel;