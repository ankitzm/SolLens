import React, { useState, useEffect } from 'react';
import { MappingStorage } from '~/lib/storage';
import { AddressMapping } from '~/lib/storage/schema';

function App() {
  const [mappings, setMappings] = useState<Map<string, AddressMapping>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [editingMapping, setEditingMapping] = useState<{ address: string; mapping: AddressMapping } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load mappings on mount
  useEffect(() => {
    loadMappings();
  }, []);

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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await MappingStorage.importData(data);
      await loadMappings();
      alert('Import successful!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      const data = await MappingStorage.exportData();
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
    const matchesTag = !selectedTag || mapping.tags.includes(selectedTag);
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
    <div className="p-4 w-[400px] h-96 flex flex-col">
      <h1 className="text-xl font-bold mb-4">WNA - Wallet Namer</h1>
      
      {/* Search and Filters */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search mappings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
        
        <div className="flex gap-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Colors</option>
            {allColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
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
              <div key={address} className="border border-gray-200 rounded p-3 text-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: mapping.color }}>
                      {mapping.name}
                    </div>
                    <div className="text-gray-500 text-xs font-mono truncate">
                      {address.slice(0, 8)}...{address.slice(-8)}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(address, mapping)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {mapping.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mapping.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import/Export */}
      <div className="flex gap-2 border-t pt-3">
        <label className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded text-sm text-center cursor-pointer hover:bg-green-200">
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
        <button
          onClick={handleExport}
          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
        >
          Export
        </button>
      </div>

      {/* Edit Modal */}
      {editingMapping && (
        <EditModal
          address={editingMapping.address}
          mapping={editingMapping.mapping}
          onSave={handleSaveEdit}
          onCancel={() => setEditingMapping(null)}
        />
      )}
    </div>
  );
}

// Edit Modal Component
function EditModal({ 
  address, 
  mapping, 
  onSave, 
  onCancel 
}: { 
  address: string; 
  mapping: AddressMapping; 
  onSave: (address: string, name: string, tags: string[], color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(mapping.name);
  const [tags, setTags] = useState(mapping.tags.join(', '));
  const [color, setColor] = useState(mapping.color);

  const handleSave = () => {
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave(address, name, tagsArray, color);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Edit Mapping</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={address}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Enter name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="protocol, fee, etc"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

