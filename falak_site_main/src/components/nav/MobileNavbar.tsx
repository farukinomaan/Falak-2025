import React from 'react';
import Link from 'next/link';
import { Press_Start_2P } from "next/font/google";
import { Home, CreditCard, Ticket, Trophy, Music, ShoppingCart, LogIn } from 'lucide-react';

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

interface MobileNavbarProps {
  show: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  activeSection: string;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ 
  show, 
  isMobileMenuOpen, 
  toggleMobileMenu, 
  activeSection, 
  menuButtonRef 
}) => {
  const menuItems = [
    { name: 'FALAK', href: '/', icon: Home },
    { name: 'CULTURAL', href: '/cultural', icon: Music },
    { name: 'SPORTS', href: '/sports', icon: Trophy },
    { name: 'PASSES', href: '/passes', icon: CreditCard },
    { name: 'TICKETS', href: '/tickets', icon: Ticket },
    { name: 'CART', href: '/cart', icon: ShoppingCart }
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex xl:hidden items-start justify-between p-4 transition-all duration-500 ${show ? 'translate-y-0' : '-translate-y-32'}`}>
        {/* Top-right notch with display and menu */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg shadow-lg border-2 transition-all duration-500 ${press.className}`}
          style={{
            backgroundColor: "rgba(50, 33, 44, 0.95)", 
            borderColor: "rgba(219, 170, 166, 0.6)", 
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(244, 202, 142, 0.15)",
          }}
        >
          {/* Cyber display */}
          <div
            className="relative px-2 py-1 rounded"
            style={{
              backgroundColor: "#32212C", 
              border: "1px solid #DBAAA6", 
              boxShadow:
                "inset 0 1px 4px rgba(0,0,0,0.7), 0 1px 2px rgba(244,202,142,0.3)",
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded bg-orange-300 opacity-20 blur-sm"></div>
              <div
                className={`relative font-mono tracking-wider font-bold uppercase ${press.className}`}
                style={{
                  color: "#F4CA8E", 
                  textShadow: "0 0 6px #F4CA8E, 0 0 8px #F4CA8E",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {activeSection.toUpperCase()}
              </div>
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="h-full w-full opacity-40"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(244,202,142,0.15) 1px, rgba(244,202,142,0.15) 2px)",
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={toggleMobileMenu}
            className="relative w-8 h-8 flex-shrink-0 focus:outline-none group rounded-full overflow-hidden"
            style={{
              background: isMobileMenuOpen
                ? "radial-gradient(circle, #D7897D 0%, #32212C 70%)" 
                : "radial-gradient(circle, #DBAAA6 0%, #32212C 100%)", 
              border: `1.5px solid ${isMobileMenuOpen ? "#DBAAA6" : "#DBAAA6"}`, 
              boxShadow: isMobileMenuOpen
                ? "0 0 16px rgba(215, 137, 125, 0.6), 0 3px 8px rgba(0,0,0,0.4)"
                : "0 2px 6px rgba(0,0,0,0.3)",
            }}
          >
            {isMobileMenuOpen && (
              <div
                className="absolute inset-0 rounded-full border-2 animate-pulse opacity-75"
                style={{ borderColor: "#DBAAA6", animationDuration: "1.5s" }}
              />
            )}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
                isMobileMenuOpen ? "w-2 h-2 animate-pulse" : "w-1 h-1"
              }`}
              style={{ backgroundColor: "#F4CA8E", boxShadow: isMobileMenuOpen ? "0 0 8px #F4CA8E" : "0 0 4px #F4CA8E" }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`absolute w-3 h-0.5 transition-all duration-500 ${isMobileMenuOpen ? "rotate-45 opacity-100" : "rotate-0 opacity-70 -translate-y-0.5"}`}
                style={{ backgroundColor: "#F4CA8E", boxShadow: isMobileMenuOpen ? "0 0 6px rgba(244,202,142,0.8)" : "none" }}
              />
              <div className={`absolute w-3 h-0.5 transition-all duration-500 ${isMobileMenuOpen ? "opacity-0 scale-0" : "opacity-70"}`}
                style={{ backgroundColor: "#F4CA8E" }}
              />
              <div className={`absolute w-3 h-0.5 transition-all duration-500 ${isMobileMenuOpen ? "-rotate-45 opacity-100" : "rotate-0 opacity-70 translate-y-0.5"}`}
                style={{ backgroundColor: "#F4CA8E", boxShadow: isMobileMenuOpen ? "0 0 6px rgba(244,202,142,0.8)" : "none" }}
              />
            </div>
            <div className={`absolute inset-0.5 rounded-full border border-opacity-40 ${isMobileMenuOpen ? 'animate-spin' : ''}`}
              style={{ borderColor: isMobileMenuOpen ? "rgba(244,202,142,0.6)" : "rgba(244,202,142,0.4)", animationDuration: "3s" }}
            />
          </button>
        </div>
      </div>

      {/* Full-Screen Menu Overlay - Top-right Layout */}
      <div className={`fixed inset-0 z-40 xl:hidden transition-all duration-300 ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0"
          onClick={toggleMobileMenu}
          style={{
            background: 'linear-gradient(135deg, rgba(42, 23, 35, 0.96) 0%, rgba(50, 33, 44, 0.94) 100%)',
            backdropFilter: 'blur(12px)'
          }}
        />

        {/* Top-right Menu Content */}
        <div className="absolute top-4 right-4 flex flex-col w-56 gap-3 z-50">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = activeSection.toUpperCase() === item.name;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={toggleMobileMenu}
                className={`group relative px-4 py-2 rounded-lg transition-all duration-300 ${press.className}`}
                style={{
                  background: isActive ? 'rgba(219, 170, 166, 0.25)' : 'rgba(219, 170, 166, 0.1)',
                  border: '1px solid rgba(219, 170, 166, 0.3)',
                  backdropFilter: 'blur(8px)',
                  animationDelay: `${index * 80}ms`,
                  boxShadow: isActive ? '0 4px 16px rgba(244, 202, 142, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/5 via-orange-400/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent 
                      size={16}
                      style={{
                        color: isActive ? '#F4CA8E' : '#DBAAA6',
                        filter: isActive ? 'drop-shadow(0 0 4px #F4CA8E)' : 'none',
                      }}
                      className="flex-shrink-0 transition-all duration-300"
                    />
                    <div className="relative font-bold tracking-wider transition-all duration-300" style={{
                      color: isActive ? '#F4CA8E' : '#DBAAA6',
                      textShadow: isActive ? '0 0 8px #F4CA8E' : 'none',
                      fontSize: '14px'
                    }}>
                      {item.name}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0" style={{
                      background: '#F4CA8E',
                      boxShadow: '0 0 8px rgba(244, 202, 142, 0.8)'
                    }}/>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Sign In button */}
          <Link
            href="/signin"
            onClick={toggleMobileMenu}
            className={`mt-6 px-6 py-2 rounded-lg transition-all duration-300 ${press.className} group w-full`}
            style={{
              background: 'rgba(219, 170, 166, 0.15)',
              border: '1px solid rgba(219, 170, 166, 0.4)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/5 via-orange-400/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-center gap-2 text-[#DBAAA6] font-bold tracking-wider text-xs">
              <LogIn size={14} /> SIGN IN
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};
