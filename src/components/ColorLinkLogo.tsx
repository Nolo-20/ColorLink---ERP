import React from 'react';

interface ColorLinkLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const ColorLinkLogo: React.FC<ColorLinkLogoProps> = ({ 
  collapsed = false, 
  size = 'md', 
  theme = 'dark',
  showSubtitle = true 
}) => {
  const isLight = theme === 'light';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const svgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${collapsed ? 'justify-center' : ''}`}>
      {/* Authentic ColorLink Brand Mark: Droplet icon */}
      <div 
        className={`${iconSizes[size]} rounded-2xl relative flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 ${
          isLight 
            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
            : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25'
        }`}
      >
        <svg 
          className={`${svgSizes[size]} fill-current drop-shadow-sm`} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C8.4 6.8 5 11.2 5 15.3C5 19.0 8.1 22 12 22C15.9 22 19 19.0 19 15.3C19 11.2 15.6 6.8 12 2ZM12 5.5C14.5 9.1 16.8 12.6 16.8 15.3C16.8 17.9 14.7 20 12 20C9.3 20 7.2 17.9 7.2 15.3C7.2 12.6 9.5 9.1 12 5.5Z"
          />
          <circle cx="12" cy="15" r="2.2" />
        </svg>
      </div>

      {/* Brand Text (Hidden when collapsed) */}
      {!collapsed && (
        <div className="text-left whitespace-nowrap">
          <div className="flex items-center tracking-tight leading-none font-black text-base">
            <span className={isLight ? 'text-slate-900' : 'text-white'}>
              COLOR
            </span>
            <span className="text-[#00D285] ml-0.5">
              LINK
            </span>
          </div>
          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D285] flex-shrink-0" />
              <span className={`text-[8.5px] font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Pinturas & Recubrimientos
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


