import React, { useState, useEffect, useRef } from 'react';
import { MappingStorage, importData as importStorageData, exportData as exportStorageData } from '~/lib/storage';
import { AddressMapping } from '~/lib/storage/schema';
import { isValidSolanaAddress } from '~/lib/utils/address';
import EditPanel from './EditPanel';
import AddPanel from './AddPanel';

function App() {
  const [mappings, setMappings] = useState<Map<string, AddressMapping>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [editingMapping, setEditingMapping] = useState<{ address: string; mapping: AddressMapping } | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement | null>(null);

  // Load mappings on mount
  useEffect(() => {
    loadMappings();
  }, []);

  // Close tag menu on outside click
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!isTagMenuOpen) return;
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setIsTagMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [isTagMenuOpen]);

  const loadMappings = async () => {
    try {
      setIsLoading(true);
      const allMappings = await MappingStorage.getAll();
      setMappings(allMappings);
    } catch (error) {
      console.error('Failed to load mappings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (address: string) => {
    if (confirm('Delete this mapping?')) {
      try {
        await MappingStorage.delete(address);
        await loadMappings();
      } catch (error) {
        console.error('Failed to delete mapping:', error);
        alert('Failed to delete mapping');
      }
    }
  };

  const handleEdit = (address: string, mapping: AddressMapping) => {
    setEditingMapping({ address, mapping });
  };

  const handleSaveEdit = async (address: string, name: string, tags: string[], color: string) => {
    try {
      await MappingStorage.save(address, { name, tags, color });
      setEditingMapping(null);
      await loadMappings();
    } catch (error) {
      console.error('Failed to save mapping:', error);
      alert('Failed to save mapping');
    }
  };

  const handleSaveAdd = async (address: string, name: string, tags: string[], color: string) => {
    try {
      if (!isValidSolanaAddress(address)) {
        alert('Invalid Solana address');
        return;
      }
      await MappingStorage.save(address, { name, tags, color });
      setIsAdding(false);
      await loadMappings();
    } catch (error) {
      console.error('Failed to add mapping:', error);
      alert('Failed to add mapping');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importStorageData(data);
      await loadMappings();
      alert('Import successful!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportStorageData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wna-mappings.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  // Filter mappings
  const filteredMappings = Array.from(mappings.entries()).filter(([address, mapping]) => {
    const matchesSearch = mapping.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTags.length === 0 || selectedTags.some(t => mapping.tags.includes(t));
    const matchesColor = !selectedColor || mapping.color === selectedColor;
    return matchesSearch && matchesTag && matchesColor;
  });

  // Get unique tags and colors for filters
  const allTags = Array.from(new Set(Array.from(mappings.values()).flatMap(m => m.tags)));
  const allColors = Array.from(new Set(Array.from(mappings.values()).map(m => m.color).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="p-4 w-[400px] h-96 flex items-center justify-center">
        <div className="text-gray-600">Loading mappings...</div>
      </div>
    );
  }

  return (
    <div className="p-4 w-96 h-[540px] flex flex-col bg-neutral-900 text-gray-200 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Wallet Mappings</h1>
        {(editingMapping || isAdding) && (
          <button
            onClick={() => { setEditingMapping(null); setIsAdding(false); }}
            className="text-sm text-gray-400 hover:text-gray-200 px-2 py-1 rounded"
          >
            Back
          </button>
        )}
      </div>

      {!editingMapping && !isAdding ? (
        <>
          {/* Search and Filters */}
          <div className="mb-4 space-y-3">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 2.326l3.35-3.35a.75.75 0 111.06 1.06l-3.35 3.35A5.5 5.5 0 009 3.5zM4 9a5 5 0 1110 0A5 5 0 014 9z" clipRule="evenodd"/></svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, address, or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-none bg-neutral-800 py-2.5 pl-10 pr-3 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div ref={tagMenuRef} className="relative">
                <button
                  onClick={() => setIsTagMenuOpen(v => !v)}
                  className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                >
                  <span>{selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'All Tags'}</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.243l3.71-4.012a.75.75 0 111.08 1.04l-4.24 4.585a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"/></svg>
                </button>
                {isTagMenuOpen && (
                  <div className="absolute z-10 mt-1 w-40 rounded-md bg-neutral-800 border border-neutral-700 shadow-lg py-1">
                    <button
                      onClick={() => { setSelectedTags([]); setIsTagMenuOpen(false); }}
                      className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-neutral-700"
                    >
                      All Tags
                    </button>
                    {allTags.map(tag => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                          }}
                          className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-700 ${active ? 'text-white' : 'text-gray-300'}`}
                        >
                          <span className={`inline-block h-3 w-3 rounded-sm border ${active ? 'bg-indigo-500 border-indigo-500' : 'border-neutral-500'}`}></span>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} className="group flex h-8 items-center justify-center gap-1.5 rounded-lg bg-neutral-800 pl-3 pr-2 text-xs font-medium text-gray-300 hover:bg-neutral-700 transition-colors">
                  <span>{tag}</span>
                  <svg className="h-4 w-4 text-gray-500 group-hover:text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.646 4.646a.5.5 0 01.708 0L10 9.293l4.646-4.647a.5.5 0 11.708.708L10.707 10l4.647 4.646a.5.5 0 01-.708.708L10 10.707l-4.646 4.647a.5.5 0 01-.708-.708L9.293 10 4.646 5.354a.5.5 0 010-.708z" clipRule="evenodd"/></svg>
                </button>
              ))}
            </div>
          </div>

          {/* Mappings List */}
          <div className="flex-1 overflow-y-auto mb-4">
            {filteredMappings.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">
                {mappings.size === 0 ? 'No mappings yet' : 'No matches found'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMappings.map(([address, mapping]) => (
                  <div key={address} className="group flex cursor-pointer items-center gap-4 p-4 min-h-[72px] justify-between bg-neutral-800/60 hover:bg-neutral-800 transition-colors duration-150 rounded-lg">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: mapping.color || '#14b8a6' }}></div>
                      <div className="flex flex-col flex-grow">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <p className="text-base font-medium text-white truncate">{mapping.name}</p>
                            <p className="text-xs font-normal text-gray-400 truncate">({address.slice(0, 4)}...{address.slice(-4)})</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(address, mapping)} className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-neutral-700 hover:text-white transition-colors" aria-label="Edit">
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.878.515l-3 1a.5.5 0 01-.633-.633l1-3a2 2 0 01.515-.879l8.5-8.5z"/></svg>
                            </button>
                            <button onClick={() => handleDelete(address)} className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors" aria-label="Delete">
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 8a1 1 0 112 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2h3a1 1 0 110 2h-1l-1 9a3 3 0 01-3 3H7a3 3 0 01-3-3L3 6H2a1 1 0 110-2h3zm2-1a1 1 0 00-1 1h8a1 1 0 00-1-1H7z"/></svg>
                            </button>
                          </div>
                        </div>
                        {mapping.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {mapping.tags.map(tag => (
                              <span key={tag} className="rounded-md bg-neutral-700 px-3 py-1 text-xs font-medium text-gray-300">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="flex gap-2 border-t border-neutral-800 pt-3">
            <label className="flex-1 flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-800 px-3 text-sm font-medium text-gray-300 hover:bg-neutral-700 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 14a2 2 0 002 2h10a2 2 0 002-2v-1a1 1 0 112 0v1a4 4 0 01-4 4H5a4 4 0 01-4-4v-1a1 1 0 112 0v1z"/><path d="M7 9a1 1 0 011.707-.707L10 9.586V3a1 1 0 112 0v6.586l1.293-1.293A1 1 0 1114.707 9.707l-3 3a1 1 0 01-1.414 0l-3-3A1 1 0 017 9z"/></svg>
              <span className="truncate">Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={handleExport} className="flex-1 flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-3 text-sm font-medium text-gray-300 hover:bg-neutral-700 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17 6a1 1 0 10-2 0v1a2 2 0 01-2 2H7a2 2 0 01-2-2V6a1 1 0 10-2 0v1a4 4 0 004 4h6a4 4 0 004-4V6z"/><path d="M13 11a1 1 0 00-1.707.707L10 12.414V19a1 1 0 102 0v-6.586l1.293 1.293A1 1 0 0014.707 12.293l-3-3z"/></svg>
              <span className="truncate">Export</span>
            </button>
            <button onClick={() => setIsAdding(true)} className="flex-1 flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
              <span className="truncate">Add New</span>
            </button>
          </div>
        </>
      ) : editingMapping ? (
        <EditPanel
          address={editingMapping.address}
          mapping={editingMapping.mapping}
          onSave={handleSaveEdit}
          onCancel={() => setEditingMapping(null)}
        />
      ) : (
        <AddPanel
          onSave={handleSaveAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}

export default App;
