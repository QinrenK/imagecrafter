'use client'

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface InputFieldProps {
  attribute: string;
  label: string;
  currentValue: string;
  handleAttributeChange: (attribute: string, value: string) => void;
  multiline?: boolean;
}

export function InputField({
  attribute,
  label,
  currentValue,
  handleAttributeChange,
  multiline
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={currentValue}
          onChange={(e) => handleAttributeChange(attribute, e.target.value)}
          onKeyDown={(e) => {
            // Allow only intentional line breaks with Shift+Enter or Enter
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Prevent default line break on single Enter
            }
          }}
        />
      ) : (
        <Input
          type="text"
          value={currentValue}
          onChange={(e) => handleAttributeChange(attribute, e.target.value)}
        />
      )}
    </div>
  );
}

export default InputField;