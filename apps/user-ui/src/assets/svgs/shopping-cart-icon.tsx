import { IconProps } from './heart-icon';

export const CartIconFilled: React.FC<IconProps> = ({
  size = 24,
  fill = 'currentColor',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H6"
      fill={fill}
    />
    <circle cx="9" cy="20" r="1.75" fill={fill} />
    <circle cx="18" cy="20" r="1.75" fill={fill} />
  </svg>
);

export const CartIconOutline: React.FC<IconProps> = ({
  size = 24,
  stroke = 'currentColor',
  strokeWidth = 1.75,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H6"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="20" r="1.5" stroke={stroke} strokeWidth={strokeWidth} />
    <circle cx="18" cy="20" r="1.5" stroke={stroke} strokeWidth={strokeWidth} />
  </svg>
);
