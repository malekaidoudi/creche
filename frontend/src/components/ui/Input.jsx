import React from 'react';

const Input = React.forwardRef(({ className = '', type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={`
        flex h-10 w-full rounded-md border px-3 py-2 text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50
        dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400
        bg-white border-gray-300 text-gray-900 placeholder:text-gray-500
        ${className}
      `}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
