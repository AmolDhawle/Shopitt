import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Control,
  Controller,
  FieldErrors,
  FieldPath,
  FieldValues,
} from 'react-hook-form';

type ColorSelectorProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  errors?: FieldErrors<T>;
};

const DEFAULT_COLORS: string[] = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#000000',
  '#ffffff',
];

const LIGHT_COLORS = new Set(['#ffffff', '#ffff00']);

const normalize = (color: string) => color.toLowerCase();

const ColorSelector = <T extends FieldValues>({
  control,
  name,
}: ColorSelectorProps<T>) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState('#ffffff');

  // Deduplicated full color list
  const allColors = useMemo(() => {
    return Array.from(
      new Set([...DEFAULT_COLORS, ...customColors].map(normalize)),
    );
  }, [customColors]);

  return (
    <div className="mt-2">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Colors
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const selectedColors = (field.value || []).map(normalize);

          const colorExists = allColors.includes(normalize(newColor));

          const handleAddColor = () => {
            const normalized = normalize(newColor);

            if (!allColors.includes(normalized)) {
              setCustomColors((prev) => [...prev, normalized]);
            }

            setShowColorPicker(false);
          };

          return (
            <div className="flex flex-col gap-3">
              {/* Row 1 — Color Swatches + Plus */}
              <div className="flex flex-wrap gap-3">
                {allColors.map((color) => {
                  const isSelected = selectedColors.includes(color);
                  const isLightColor = LIGHT_COLORS.has(color);

                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() =>
                        field.onChange(
                          isSelected
                            ? selectedColors.filter((c) => c !== color)
                            : [...selectedColors, color],
                        )
                      }
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-md border-2 transition flex items-center justify-center
                        ${
                          isSelected
                            ? 'scale-110 ring-2 ring-white border-transparent'
                            : isLightColor
                              ? 'border-gray-600'
                              : 'border-transparent'
                        }
                      `}
                    />
                  );
                })}

                {/* Toggle Picker Button */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker((prev) => !prev)}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-300 bg-gray-800 hover:bg-gray-700 transition"
                >
                  <Plus size={16} color="white" />
                </button>
              </div>

              {/* Row 2 — Color Picker */}
              {showColorPicker && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(normalize(e.target.value))}
                    className="w-10 h-10 p-0 border-none cursor-pointer"
                  />

                  <button
                    type="button"
                    disabled={colorExists}
                    onClick={handleAddColor}
                    className={`px-3 py-2 rounded-md text-sm transition
                             bg-gray-300 text-black hover:bg-gray-200
                            disabled:bg-gray-500 disabled:text-white
                              disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default ColorSelector;
