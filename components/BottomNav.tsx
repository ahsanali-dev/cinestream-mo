"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav = () => {
    const pathname = usePathname();

    const navItems = [
        { icon: 'ph-fill ph-house', label: 'Home', path: '/' },
        { icon: 'ph-bold ph-compass', label: 'Explore', path: '/explore' },
        { icon: 'ph-bold ph-monitor', label: 'Series', path: '/tv-shows' },
        { icon: 'ph-bold ph-popcorn', label: 'Movies', path: '/movies' },
        { icon: 'ph-bold ph-heart', label: 'Watchlist', path: '/watchlist' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[150] flex h-16 items-center justify-around border-t border-white/10 bg-black/80 px-4 backdrop-blur-xl md:hidden">
            {navItems.map((item, index) => (
                <Link
                    key={index}
                    href={item.path}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                        pathname === item.path ? 'text-accent' : 'text-[#a0a0a0]'
                    }`}
                >
                    <i className={`${item.icon} text-2xl`}></i>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;
