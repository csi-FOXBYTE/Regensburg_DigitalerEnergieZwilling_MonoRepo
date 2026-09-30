export type ArrowIconProps = {
  className?: string;
  strokeClass?: string;
};

export default function ArrowIcon({
  className = '',
  strokeClass = 'stroke-white',
}: ArrowIconProps) {
  return (
    <div className={`shrink-0 overflow-hidden ${className}`.trim()}>
      <svg
        className="mr-1.5 -ml-1.5 w-6 transition-[margin] duration-300 ease-in-out group-hover/button:mr-0 group-hover/button:ml-0"
        viewBox="0 0 32 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 8h31.042"
          className={`${strokeClass} stroke-2 transition-colors duration-300`}
        />
        <path
          d="M24.651 1.055l6.391 6.945-6.391 6.945"
          className={`${strokeClass} stroke-2 transition-colors duration-300`}
          strokeLinecap="square"
        />
      </svg>
    </div>
  );
}
