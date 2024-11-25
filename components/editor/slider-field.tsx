'use client'

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';     

interface SliderFieldProps {
  attribute: string;
  label: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  handleAttributeChange: (attribute: string, value: number) => void;
  allowEmpty?: boolean;
}

const SliderField = ({
  attribute,
  label,
  min,
  max,
  step,
  currentValue,
  handleAttributeChange,
  allowEmpty = true
}: SliderFieldProps) => {
  const [inputValue, setInputValue] = React.useState<string>(currentValue.toString());
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (!isDirty) {
      setInputValue(currentValue.toString());
    }
  }, [currentValue, isDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsDirty(true);
    
    if (value === '' && allowEmpty) {
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handleAttributeChange(attribute, numValue);
    }
  };

  const handleInputBlur = () => {
    setIsDirty(false);
    
    if (inputValue === '') {
      if (allowEmpty) {
        handleAttributeChange(attribute, min);
      }
      setInputValue(min.toString());
      return;
    }

    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      numValue = min;
    }

    // Clamp value between min and max
    numValue = Math.max(min, Math.min(max, numValue));
    setInputValue(numValue.toString());
    handleAttributeChange(attribute, numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-20 text-right font-sans"
        />
      </div>
      <Slider
        value={[parseFloat(inputValue) || min]}
        min={min}
        max={max}
        step={step}
        onValueChange={([value]) => {
          setIsDirty(false);
          setInputValue(value.toString());
          handleAttributeChange(attribute, value);
        }}
      />
    </div>
  );
};

export default SliderField;