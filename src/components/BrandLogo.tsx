import React from 'react';

interface BrandLogoProps {
  dark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ dark = false, className = '' }) => {
  const src = dark ? '/assinapovo-logo-dark.png' : '/assinapovo-logo-light.png';

  return (
    <img
      src={src}
      alt="AssinaPovo"
      className={`h-auto w-44 object-contain ${className}`.trim()}
    />
  );
};
