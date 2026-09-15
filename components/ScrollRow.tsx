"use client";
import React, { Children } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";

interface ScrollRowProps {
  children: React.ReactNode;
}

export default function ScrollRow({ children }: ScrollRowProps) {
  return (
    <div className="relative group/row w-full">
      {/* Swiper Slider Row */}
      <div className="px-2 py-4">
        <Swiper
          modules={[FreeMode, Mousewheel]}
          slidesPerView="auto"
          spaceBetween={24} // Gap between slides matching style
          freeMode={{
            enabled: true,
            sticky: false,
            momentumBounce: false,
          }}
          mousewheel={{
            forceToAxis: true,
            sensitivity: 1.2,
          }}
          className="w-full !overflow-visible"
        >
          {Children.map(children, (child, idx) => {
            if (!child) return null;
            return (
              <SwiperSlide key={idx} className="!w-auto">
                {child}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
