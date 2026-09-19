type BrandLogoProps = {
  className?: string;
  size?: number;
  alt?: string;
};

export function BrandLogo({ className = "", size = 24, alt = "Knights Battle Zone logo" }: BrandLogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`.trim()}
      loading="eager"
      decoding="async"
    />
  );
}


