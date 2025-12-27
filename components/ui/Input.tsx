import React from 'react';

interface BaseProps {
  label: string;
  error?: string;
  className?: string;
  required?: boolean;
}

interface TextInputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: string[];
}
interface CheckboxProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput: React.FC<TextInputProps> = ({ label, error, className = "", required, ...props }) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
          error ? 'border-red-500' : 'border-slate-300'
        } disabled:bg-slate-100 disabled:text-slate-500`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const SelectInput: React.FC<SelectProps> = ({ label, error, options, className = "", required, ...props }) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
          error ? 'border-red-500' : 'border-slate-300'
        } disabled:bg-slate-100 disabled:text-slate-500`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const CheckboxInput: React.FC<CheckboxProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`mb-4 flex items-center ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
        {...props}
      />
      <label className="ml-2 block text-sm text-slate-700">
        {label}
      </label>
      {error && <p className="ml-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
