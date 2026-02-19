import {
  Control,
  Controller,
  FieldValues,
  ArrayPath,
  FieldErrors,
  Path,
} from 'react-hook-form';
import Input from '../input/index.tsx';
import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type CustomPropertiesProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  errors?: FieldErrors<T>;
};

function CustomProperties<T extends FieldValues>({
  control,
  name,
  errors,
}: CustomPropertiesProps<T>) {
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  return (
    <div>
      <div className="flex flex-col gap-4">
        <Controller
          name={name as unknown as Path<T>}
          control={control}
          render={({ field }) => {
            const properties: { label: string; values: string[] }[] =
              field.value || [];

            const addProperty = () => {
              if (!newLabel.trim()) return;

              field.onChange([...properties, { label: newLabel, values: [] }]);

              setNewLabel('');
            };

            const addValue = (index: number) => {
              if (!newValue.trim()) return;

              const updated = [...properties];
              updated[index] = {
                ...updated[index],
                values: [...updated[index].values, newValue],
              };

              field.onChange(updated);
              setNewValue('');
            };

            const removeProperty = (index: number) => {
              field.onChange(properties.filter((_, i) => i !== index));
            };

            return (
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Custom Properties
                </label>
                <div className="flex flex-col gap-3 ">
                  {/* Existing Properties */}

                  {properties.map((property, index) => (
                    <div
                      key={index}
                      className="p-2 border border-gray-700 rounded-lg bg-gray-900"
                    >
                      <div className="flex items-center justify-between ">
                        <span className="text-white font-medium">
                          {property.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProperty(index)}
                        >
                          <X size={18} className="text-red-500" />
                        </button>
                      </div>

                      {/* Add value to property */}
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newValue}
                          className="border outline-none border-gray-700 bg-white p-2 rounded-md text-black w-full"
                          placeholder="Enter value..."
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-blue-500 text-white rounded-md"
                          onClick={() => addValue(index)}
                        >
                          Add
                        </button>
                      </div>
                      {/* Show values */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {property.values.map((value, valIndex) => (
                          <span
                            key={valIndex}
                            className="p-2 bg-gray-300 text-black rounded-md text-sm"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Add new property */}
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      placeholder="Enter property label (e.g., Material, Warranty)"
                      value={newLabel}
                      onChange={(e: any) => setNewLabel(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md flex items-center"
                      onClick={addProperty}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
                {errors?.[name] && (
                  <p className="text-red-500 text-xs mt-1">
                    {(errors[name] as any)?.message}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export default CustomProperties;
