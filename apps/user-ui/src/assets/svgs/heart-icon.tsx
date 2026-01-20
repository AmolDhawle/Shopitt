import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

export const HeartIconOutline: React.FC<IconProps> = ({
  size = 24,
  stroke = 'currentColor',
  strokeWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 21C12 21 4 14.5 4 9C4 6 6 4 8.5 4C10 4 11 5 12 6C13 5 14 4 15.5 4C18 4 20 6 20 9C20 14.5 12 21 12 21Z" />
  </svg>
);

export const HeartIconFilled: React.FC<IconProps> = ({
  size = 24,
  fill = 'currentColor',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 21C12 21 4 14.5 4 9C4 6 6 4 8.5 4C10 4 11 5 12 6C13 5 14 4 15.5 4C18 4 20 6 20 9C20 14.5 12 21 12 21Z" />
  </svg>
);
