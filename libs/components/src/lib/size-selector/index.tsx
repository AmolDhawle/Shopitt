import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form';

type CustomPropertiesProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  errors?: FieldErrors<T>;
};

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

function SizeSelector<T extends FieldValues>({
  control,
  name,
  errors,
}: CustomPropertiesProps<T>) {
  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">Sizes</label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const selectedSizes: string[] = field.value || [];

          return (
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => {
                const isSelected = selectedSizes.includes(size);

                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() =>
                      field.onChange(
                        isSelected
                          ? selectedSizes.filter((s) => s !== size)
                          : [...selectedSizes, size],
                      )
                    }
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-gray-900 text-white border border-[#ffffff6b]'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          );
        }}
      />

      {errors?.[name] && (
        <p className="text-red-500 text-xs mt-1">
          {(errors[name]?.message as string) || ''}
        </p>
      )}
    </div>
  );
}

export default SizeSelector;
