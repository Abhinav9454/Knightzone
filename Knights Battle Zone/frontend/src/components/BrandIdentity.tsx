import { BrandLogo } from "@/components/BrandLogo";

type BrandIdentityProps = {
  className?: string;
  logoSize?: number;
  logoClassName?: string;
  textClassName?: string;
  showLogo?: boolean;
  showText?: boolean;
  hideTextOnMobile?: boolean;
};

export function BrandIdentity({
  className = "",
  logoSize = 24,
  logoClassName = "",
  textClassName = "text-lg",
  showLogo = true,
  showText = true,
  hideTextOnMobile = false,
}: BrandIdentityProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      {showLogo && <BrandLogo size={logoSize} className={`shrink-0 rounded-md ${logoClassName}`.trim()} />}
      {showText && (
        <span className={`${hideTextOnMobile ? "hidden sm:inline-flex" : "inline-flex"} items-baseline gap-1 font-black tracking-tight ${textClassName}`.trim()}>
          <span className="text-foreground">KNIGHTS</span>
          <span className="bg-gradient-to-r from-[#54D6FF] to-[#9EF01A] bg-clip-text text-transparent">BATTLE ZONE</span>
        </span>
      )}
    </span>
  );
}
