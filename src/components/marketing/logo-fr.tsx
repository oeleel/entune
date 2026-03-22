import Image from 'next/image';

/** Source asset is 100×392 (tall mark); size via CSS for correct proportions. */
export function LogoFr({ variant }: { variant: 'hero' | 'header' }) {
  return (
    <Image
      src="/LogoFr.png"
      alt=""
      width={100}
      height={392}
      priority={variant === 'hero'}
      sizes={variant === 'hero' ? '(max-width: 560px) 48px, 54px' : '19px'}
      className={
        variant === 'hero'
          ? 'entune-logo-fr entune-logo-fr-hero'
          : 'entune-logo-fr entune-logo-fr-header'
      }
    />
  );
}
