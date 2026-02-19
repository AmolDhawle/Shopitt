import {
  Control,
  Controller,
  FieldValues,
  ArrayPath,
  useFieldArray,
  FieldPath,
} from 'react-hook-form';
import Input from '../input/index.tsx';
import { PlusCircle, Trash } from 'lucide-react';

type CustomSpecificationsProps<
  T extends FieldValues,
  TName extends ArrayPath<T>,
> = {
  control: Control<T>;
  name: TName;
};

function CustomSpecifications<
  T extends FieldValues,
  TName extends ArrayPath<T>,
>({ control, name }: CustomSpecificationsProps<T, TName>) {
  const { fields, append, remove } = useFieldArray<T, TName>({
    control,
    name,
  });

  return (
    <div>
      <label className="block font-semibold text-gray-300 mb-2">
        Custom Specifications
      </label>

      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-start">
            <Controller
              name={`${name}.${index}.name` as FieldPath<T>}
              control={control}
              rules={{ required: 'Specification name is required' }}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    label="Specification"
                    placeholder="e.g., RAM"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />

            <Controller
              name={`${name}.${index}.value` as FieldPath<T>}
              control={control}
              rules={{ required: 'Specification value is required' }}
              render={({ field, fieldState }) => (
                <>
                  <Input {...field} label="Value" placeholder="e.g., 8GB" />
                  {fieldState.error && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-6 text-red-500 hover:text-red-700 transition"
            >
              <Trash size={18} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ name: '', value: '' } as any)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition"
        >
          <PlusCircle size={18} />
          Add Specification
        </button>
      </div>
    </div>
  );
}

export default CustomSpecifications;
