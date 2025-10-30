import React, { useState } from 'react';
import { isValidSolanaAddress } from '~/lib/utils/address';

const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

function AddPanel({
  onSave,
  onCancel,
}: {
  onSave: (address: string, name: string, tags: string[], color: string) => void;
  onCancel: () => void;
}) {
  const [address, setAddress] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState<string>('#3b82f6');

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

  const canSave = isValidSolanaAddress(address) && name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(address.trim(), name.trim(), tags, color);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-5 text-gray-200 shadow-xl">
        <div className="mb-5">
          <p className="text-2xl font-bold leading-tight text-white">Add Wallet</p>
          <p className="mt-1 text-sm text-gray-400">Create a new mapping for a wallet address.</p>
        </div>

        <div className="space-y-5">
          {/* Address */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter a Solana address"
              className={`h-11 w-full rounded-lg border p-3 font-mono text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
                isValidSolanaAddress(address)
                  ? 'border-neutral-700 bg-neutral-900 text-gray-100 focus:ring-indigo-500/50'
                  : 'border-red-500/40 bg-neutral-900 text-gray-100 focus:ring-red-500/40'
              }`}
            />
            {!isValidSolanaAddress(address) && address.length > 0 && (
              <p className="mt-1 text-xs text-red-400">Enter a valid Solana address (base58, 32–44 chars).</p>
            )}
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
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
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

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="h-10 rounded-lg px-4 text-sm font-medium text-gray-200 hover:bg-white/5">
              Cancel
            </button>
            <button type="button" disabled={!canSave} onClick={handleSave} className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              Save Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPanel;

