'use client';

import React from 'react';
interface BaseProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'textarea';
  className?: string;
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;

type TextAreaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Props = InputProps | TextAreaProps;

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, type, className, ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1 text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        {type === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`w-full px-4 py-2 pl-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none ${className}`}
            {...(rest as TextAreaProps)}
          />
        ) : (
          <input
            type={type}
            ref={ref as React.Ref<HTMLInputElement>}
            className={`w-full px-4 py-2 pl-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none  ${className}`}
            {...(rest as InputProps)}
          />
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
