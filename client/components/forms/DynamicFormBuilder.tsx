import { useState } from 'react';
import { FormField, FormFieldType } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';

interface DynamicFormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const fieldTypes: FormFieldType[] = [
  'text',
  'email',
  'phone',
  'textarea',
  'file',
  'date',
  'select',
  'checkbox',
];

export function DynamicFormBuilder({ fields, onChange }: DynamicFormBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<FormField>>({});

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: 'New Field',
      type: 'text',
      required: false,
      order: fields.length,
      options: [],
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const startEditing = (field: FormField) => {
    setEditingId(field.id);
    setEditingData({ ...field });
  };

  const saveEditing = () => {
    if (!editingId || !editingData.label) return;

    const updated = fields.map(f =>
      f.id === editingId
        ? {
            ...f,
            ...editingData,
            name: editingData.name || f.name,
            label: editingData.label || f.label,
            type: editingData.type || f.type,
          }
        : f
    );
    onChange(updated);
    setEditingId(null);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;

    const newFields = [...fields];
    const [field] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, field);

    // Update order values
    newFields.forEach((f, idx) => {
      f.order = idx;
    });

    onChange(newFields);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Application Form Fields</h3>
          <Button onClick={addField} size="sm" variant="outline">
            <Plus size={16} className="mr-2" />
            Add Field
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Create custom form fields that candidates will fill when applying for this job.
        </p>

        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-4">No fields added yet</p>
            <Button onClick={addField} size="sm">
              <Plus size={16} className="mr-2" />
              Add First Field
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
              >
                {editingId === field.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Field Label
                        </Label>
                        <Input
                          value={editingData.label || ''}
                          onChange={(e) =>
                            setEditingData(prev => ({ ...prev, label: e.target.value }))
                          }
                          placeholder="e.g., Resume"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Field Name
                        </Label>
                        <Input
                          value={editingData.name || ''}
                          onChange={(e) =>
                            setEditingData(prev => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="e.g., resume"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Field Type
                        </Label>
                        <select
                          value={editingData.type || 'text'}
                          onChange={(e) =>
                            setEditingData(prev => ({
                              ...prev,
                              type: e.target.value as FormFieldType,
                            }))
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        >
                          {fieldTypes.map(type => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingData.required || false}
                            onChange={(e) =>
                              setEditingData(prev => ({ ...prev, required: e.target.checked }))
                            }
                          />
                          Required
                        </Label>
                      </div>
                    </div>

                    {editingData.type === 'select' && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Options (one per line)
                        </Label>
                        <textarea
                          value={(editingData.options || []).join('\n')}
                          onChange={(e) =>
                            setEditingData(prev => ({
                              ...prev,
                              options: e.target.value
                                .split('\n')
                                .map(o => o.trim())
                                .filter(Boolean),
                            }))
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
                          rows={3}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    {['text', 'email', 'phone', 'textarea', 'file', 'date'].includes(
                      editingData.type || 'text'
                    ) && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Placeholder
                        </Label>
                        <Input
                          value={editingData.placeholder || ''}
                          onChange={(e) =>
                            setEditingData(prev => ({ ...prev, placeholder: e.target.value }))
                          }
                          placeholder="Help text shown in the field"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={saveEditing}
                        size="sm"
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{field.label}</h4>
                          {field.required && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Type: {field.type}</span>
                          <span>Name: {field.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => moveField(index, index - 1)}
                          className="p-2 hover:bg-secondary rounded transition-colors"
                          title="Move up"
                        >
                          <ChevronDown size={16} className="rotate-180 text-muted-foreground" />
                        </button>
                      )}
                      {index < fields.length - 1 && (
                        <button
                          onClick={() => moveField(index, index + 1)}
                          className="p-2 hover:bg-secondary rounded transition-colors"
                          title="Move down"
                        >
                          <ChevronDown size={16} className="text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(field)}
                        className="px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
