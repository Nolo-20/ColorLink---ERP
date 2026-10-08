import React from 'react';

interface ColorLinkLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

/** Logo oficial de ColorLink (ícono de espiral + "ColorLink"), con variante para fondo claro u oscuro. */
export const ColorLinkLogo: React.FC<ColorLinkLogoProps> = ({
  collapsed = false,
  size = 'md',
  theme = 'dark',
  showSubtitle = true
}) => {
  const isLight = theme === 'light';
  const height = { sm: 'h-7', md: 'h-8', lg: 'h-11' }[size];
  const iconSize = { sm: 'h-7', md: 'h-9', lg: 'h-11' }[size];

  return (
    <div className={`flex flex-col select-none ${collapsed ? 'items-center' : 'items-start'}`}>
      {collapsed ? (
        <img src="/brand/logo-icon.svg" alt="ColorLink" className={`${iconSize} w-auto`} draggable={false} />
      ) : (
        <img src={`/brand/logo-on-${isLight ? 'light' : 'dark'}.svg`} alt="ColorLink" className={`${height} w-auto`} draggable={false} />
      )}
      {!collapsed && showSubtitle && (
        <span className={`text-[8.5px] font-bold uppercase tracking-wider mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          ERP · Pinturas & Recubrimientos
        </span>
      )}
    </div>
  );
};
