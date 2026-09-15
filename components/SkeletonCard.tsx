import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="w-full">
      <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-white/5 animate-shimmer">
        <div className="absolute inset-x-0 bottom-4 px-4">
            <div className="h-4 w-3/4 rounded bg-white/10 mb-2"></div>
            <div className="h-3 w-1/2 rounded bg-white/10"></div>
        </div>
      </div>
      <div className="mt-4 h-4 w-3/4 rounded bg-white/5 animate-shimmer"></div>
      <div className="mt-2 h-3 w-1/2 rounded bg-white/5 animate-shimmer"></div>
    </div>
  );
};

export default SkeletonCard;
