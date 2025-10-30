import React, { useState, useEffect } from "react";
import { truncateAddress } from "~/lib/utils/address";

const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

interface NamingModalProps {
  address: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; tags: string[]; color?: string }) => Promise<void>;
  existingData?: {
    name: string;
    tags?: string[];
    color?: string;
  } | null;
}

export function NamingModal({
  address,
  isOpen,
  onClose,
  onSave,
  existingData,
}: NamingModalProps) {
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState("#3b82f6");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showFullAddress, setShowFullAddress] = useState(false);

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && existingData) {
      setName(existingData.name || "");
      setTags(existingData.tags || []);
      setColor(existingData.color || "#3b82f6");
    } else if (isOpen && !existingData) {
      setName("");
      setTags([]);
      setColor("#3b82f6");
    }
    setTagInput("");
    setError("");
  }, [isOpen, existingData]);

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags(prev => [...prev, t]);
    setTagInput("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        tags,
        color: color || undefined,
      });

      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative mx-4 w-full max-w-lg rounded-xl border-2 border-neutral-700 bg-neutral-800 text-gray-200 shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-2xl font-bold leading-tight text-white">{existingData ? 'Edit Wallet' : 'Name This Wallet'}</p>
            <p className="mt-1 text-sm text-gray-400">{existingData ? 'Modify the details for your wallet.' : 'Set a name, tags, and color for this wallet.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Wallet Address</label>
              <div className="relative flex items-center">
                <input
                  className="h-11 w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 p-3 font-mono text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  readOnly
                  value={showFullAddress ? address : truncateAddress(address)}
                  onClick={() => setShowFullAddress(!showFullAddress)}
                  title={showFullAddress ? 'Click to truncate' : 'Click to show full address'}
                />
                <button type="button" onClick={() => navigator.clipboard.writeText(address)} className="absolute right-3 text-gray-400 hover:text-white">
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
                disabled={isSaving}
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
              <div className="flex items-center gap-2 flex-1 min-w-[140px] relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length > 0 ? '' : 'Add a tag...'}
                  className="form-input flex-1 border-none bg-transparent p-1 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-0"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  disabled={isSaving || tagInput.trim().length === 0}
                  className="h-7 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 absolute right-1"
                >
                  Add
                </button>
              </div>
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
                    disabled={isSaving}
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

            {/* Error */}
            {error && (
              <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="h-10 rounded-lg px-4 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : existingData ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



