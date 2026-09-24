"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useInstallModal } from '@/context/InstallModalContext';

const Sidebar = () => {
    const pathname = usePathname();
    const { openInstallModal } = useInstallModal();

    const navItems = [
        { icon: 'ph-fill ph-house', label: 'Home', path: '/' },
        { icon: 'ph-bold ph-compass', label: 'Explore', path: '/explore' },
        { icon: 'ph-bold ph-monitor', label: 'TV Shows', path: '/tv-shows' },
        { icon: 'ph-bold ph-popcorn', label: 'Movies', path: '/movies' },
        { icon: 'ph-bold ph-heart', label: 'Watchlist', path: '/watchlist' },
    ];

    return (
        <aside className="group/sidebar fixed left-0 top-0 z-100 flex h-screen w-20 flex-col items-center justify-between border-r border-white/10 bg-black/80 py-8 transition-all duration-500 ease-in-out hover:w-52 backdrop-blur-xl hidden md:flex">
            <div className="w-full flex flex-col items-center">
                <Link href="/" className="mb-10 flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110">
                    <img 
                        src="/logo.png" 
                        alt="MoviesZone Logo" 
                        className="w-10 h-10 object-contain drop-shadow-[0_0_14px_rgba(255,106,0,0.6)]" 
                    />
                    <span className="hidden group-hover/sidebar:block text-[10px] font-black tracking-widest text-accent italic uppercase mt-1.5 transition-all">
                        MoviesZone
                    </span>
                </Link>
                <nav className="flex w-full flex-col gap-3">
                    {navItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.path}
                            className={`group relative flex h-14 w-full cursor-pointer items-center px-6 transition-all duration-300 hover:bg-white/5 ${
                                pathname === item.path ? 'border-l-4 border-accent text-white bg-accent/10' : 'text-[#a0a0a0] hover:text-white'
                            }`}
                        >
                            <i className={`${item.icon} min-w-[32px] text-center text-2xl transition-transform duration-300 group-hover:scale-110`}></i>
                            <span className="ml-4 whitespace-nowrap font-semibold opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 -translate-x-4">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Direct App Download Button at Bottom */}
            <div className="w-full px-3">
                <Link
                    href="/app"
                    className={`group/btn relative flex h-12 w-full cursor-pointer items-center justify-start rounded-2xl border transition-all duration-300 shadow-[0_0_15px_rgba(255,106,0,0.15)] hover:shadow-[0_0_20px_rgba(255,106,0,0.4)] px-3 ${
                        pathname === '/app'
                            ? 'bg-accent border-accent text-white shadow-accent/30'
                            : 'bg-gradient-to-r from-accent/20 to-accent/5 border-accent/30 hover:border-accent hover:from-accent hover:to-[#ff7b1a] text-accent hover:text-white'
                    }`}
                    title="Download Official Android App (100% Ad-Free)"
                >
                    <div className="min-w-[32px] flex items-center justify-center">
                        <i className="ph-fill ph-android-logo text-2xl transition-transform duration-300 group-hover/btn:scale-110"></i>
                    </div>
                    <span className="ml-3 whitespace-nowrap font-black text-xs uppercase tracking-wider opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 -translate-x-4">
                        Get App
                    </span>
                    <span className="hidden group-hover/sidebar:inline-block ml-auto text-[8px] bg-accent text-white font-black px-1.5 py-0.5 rounded uppercase shadow-sm">
                        APK
                    </span>
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;

