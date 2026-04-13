import * as React from "react";
import { cn } from "@/lib/utils";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  id?: string;
};

function Slider({ value, onChange, min, max, step = 1, className, id }: SliderProps) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("h-4 w-full cursor-pointer accent-primary", className)}
    />
  );
}

export { Slider };
