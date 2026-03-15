import React from 'react';
import { useFormContext } from 'react-hook-form';
import { COUNTRIES } from './countries';

export function PhoneInput() {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  // Update the phone number with the selected country code
  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setValue('country_code', code, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div>
      <label
        htmlFor="phone_number"
        className="block text-sm font-medium text-gray-700"
      >
        Phone number
      </label>
      <div className="flex gap-2">
        {/* Country code selector */}
        <select
          id="country-code"
          {...register('country_code', {
            required: 'Country code is required',
          })}
          onChange={handleCountryCodeChange}
          className="w-24 rounded-md border px-3 py-2 text-sm"
          aria-invalid={!!errors.country_code}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Phone number input */}
        <input
          type="tel"
          placeholder="1234567890"
          className="w-full rounded-md border px-3 py-2 text-sm"
          {...register('phone_number', {
            required: 'Phone number is required',
            pattern: {
              value: /^[0-9]{6,15}$/,
              message: 'Phone number must contain 6 to 15 digits',
            },
          })}
          aria-invalid={!!errors.phone_number}
        />
      </div>

      {/* Show error messages */}
      {errors.phone_number && (
        <p className="text-red-500 text-sm mt-1">
          {errors.phone_number.message as string}
        </p>
      )}
    </div>
  );
}
