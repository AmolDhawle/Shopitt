const TitleBorder = ({ className = 'w-4 h-4 text-[#3489FF]' }) => {
  return (
    <svg
      viewBox="0 0 200 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 15C40 5 160 5 195 15"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="100" cy="15" r="4" fill="currentColor" />
    </svg>
  );
};

export default TitleBorder;
