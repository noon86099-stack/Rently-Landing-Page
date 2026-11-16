type RentlyMarkProps = {
  size?: number;
  inverse?: boolean;
};

export function RentlyMark({ size = 36, inverse = false }: RentlyMarkProps) {
  const ink = inverse ? '#f4f1e7' : '#152d3b';
  const signal = inverse ? '#d8ed7a' : '#315fdb';

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M8 12V7H31L41 17V39H35" stroke={ink} strokeWidth="2" />
      <path d="M13 35V14H25.5C30.2 14 33 16.4 33 20.2C33 24.1 30.2 26.2 25.5 26.2H13" stroke={signal} strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M24 26L33.5 36" stroke={ink} strokeWidth="2.8" strokeLinecap="square" />
      <path d="M31 7V17H41" stroke={signal} strokeWidth="2" />
      <path d="M8 30V36L14 42H27" stroke={ink} strokeWidth="2" />
    </svg>
  );
}

export function RentlyWordmark({ size = 34, inverse = false }: RentlyMarkProps) {
  return (
    <span
      dir="ltr"
      className={`inline-flex items-center gap-2.5 font-bold tracking-[-.075em] ${
        inverse ? 'text-[#f4f1e7]' : 'text-[#152d3b]'
      }`}
    >
      <RentlyMark size={size} inverse={inverse} />
      <span className={size >= 40 ? 'text-[22px]' : 'text-[20px]'}>
        rently<span className={inverse ? 'text-[#d8ed7a]' : 'text-[#315fdb]'}>/</span>
      </span>
    </span>
  );
}
