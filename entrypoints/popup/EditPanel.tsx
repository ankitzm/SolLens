import { AddressMapping } from "@/lib/storage/schema";

function EditPanel({
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
    const [color, setColor] = useState(mapping.color || '#3b82f6');

    const handleSave = () => {
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        onSave(address, name, tagsArray, color);
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Edit Mapping</h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input
                            type="text"
                            value={address}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-100 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Enter name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="protocol, fee, etc"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full h-10 border border-gray-200 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditPanel;