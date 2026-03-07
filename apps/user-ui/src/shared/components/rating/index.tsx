'use client';
import React, { useState } from 'react';

type RatingProps = {
  value: number;
  max?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
};

const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  size = 20,
  readOnly = false,
  onChange,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // Rating display logic, hover overrides the value
  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (readOnly) return; // Don't allow changes if readOnly is true
    onChange?.(rating); // Trigger onChange if provided
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLSpanElement>,
    index: number,
  ) => {
    if (readOnly) return; // Don't handle mouse events if readOnly
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;

    const newValue = percent <= 0.5 ? index + 0.5 : index + 1;
    setHoverValue(newValue);
  };

  const handleMouseLeave = () => {
    if (readOnly) return; // Don't reset hover value if readOnly
    setHoverValue(null); // Reset hover value
  };

  return (
    <div className="flex items-center ">
      {Array.from({ length: max }).map((_, index) => {
        const isFull = displayValue >= index + 1;
        const isHalf = displayValue >= index + 0.5 && displayValue < index + 1;

        return (
          <span
            key={index}
            onClick={() => handleClick(index + 1)}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              fontSize: size,
              position: 'relative',
              display: 'inline-block',
              width: size,
              height: size,
            }}
          >
            {/* Empty Star */}
            <span style={{ color: '#d1d5db', outlineColor: 'yellow' }}>★</span>

            {/* Full Star */}
            {isFull && (
              <span
                style={{
                  color: '#facc15',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  textShadow: `
                    -1px -1px 0 #facc15,
                    1px -1px 0 #facc15,
                    -1px  1px 0 #facc15,
                    1px  1px 0 #facc15
                  `,
                }}
              >
                ★
              </span>
            )}

            {/* Half Star */}
            {isHalf && (
              <span
                style={{
                  color: '#facc15',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '50%',
                  overflow: 'hidden',
                }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default Rating;
