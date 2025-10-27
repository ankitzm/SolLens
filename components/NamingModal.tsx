import React, { useState, useEffect } from "react";
import { truncateAddress } from "~/lib/utils/address";

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
  const [tagsInput, setTagsInput] = useState("");
  const [color, setColor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showFullAddress, setShowFullAddress] = useState(false);

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && existingData) {
      setName(existingData.name || "");
      setTagsInput(existingData.tags?.join(", ") || "");
      setColor(existingData.color || "");
    } else if (isOpen && !existingData) {
      // Reset form for new entry
      setName("");
      setTagsInput("");
      setColor("");
    }
    setError("");
  }, [isOpen, existingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);

    try {
      // Parse tags from comma-separated string
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">
            {existingData ? "Edit Address Name" : "Name This Address"}
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Address Display */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
              Address
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="text-sm font-mono text-gray-800 hover:text-purple-600 transition-colors break-all text-left w-full"
                title={showFullAddress ? "Click to truncate" : "Click to show full address"}
              >
                {showFullAddress ? address : truncateAddress(address)}
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(address)}
                className="absolute right-0 top-0 text-xs text-gray-500 hover:text-purple-600 ml-2"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ProtocolA: FeeWallet"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              required
              disabled={isSaving}
              autoFocus
            />
          </div>

          {/* Tags Input */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-1">
              Tags <span className="text-xs text-gray-500 font-normal">(comma-separated)</span>
            </label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., protocol-a, fee, treasury"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label htmlFor="color" className="block text-sm font-semibold text-gray-700 mb-1">
              Color <span className="text-xs text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="color"
                type="color"
                value={color || "#6366f1"}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                disabled={isSaving}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                disabled={isSaving}
              />
              {color && (
                <button
                  type="button"
                  onClick={() => setColor("")}
                  className="text-gray-400 hover:text-gray-600 text-sm px-2"
                  disabled={isSaving}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-blue-500 rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : existingData ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



