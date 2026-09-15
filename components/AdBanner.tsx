import React from 'react';

const AdBanner = () => {
  return (
    <div className="px-8 md:px-16 pt-8">
      <div className="flex h-24 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/10 bg-gradient-to-r from-[#1a1a1c] to-[#252529] text-[10px] sm:text-xs font-medium uppercase tracking-[2px] text-[#a0a0a0] transition-all hover:bg-white/5">
        <i className="ph-bold ph-megaphone mr-3 text-lg"></i>
        Advertisement Space (Put Ads Code Here)
      </div>
    </div>
  );
};

export default AdBanner;
