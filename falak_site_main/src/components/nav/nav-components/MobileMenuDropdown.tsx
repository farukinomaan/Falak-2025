import React from 'react';
import Link from 'next/link';
import { RetroButton } from './RetroButton';
import { Press_Start_2P } from 'next/font/google';

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

interface NavItem {
  id: string;
  label: string;
  href: string;
}

interface MobileMenuDropdownProps {
  isMobileMenuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>; // ADDED | null
  mobileNavItems: NavItem[];
  activeSection: string;
  handleItemClick: (id: string) => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>; // ADDED | null
}

export const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({ isMobileMenuOpen, menuRef, mobileNavItems, activeSection, handleItemClick, menuButtonRef }) => {
  
  return (
    <>
      <div
        ref={menuRef}
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 xl:hidden transition-all duration-500 ease-out transform w-[95%] max-w-md
          ${isMobileMenuOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
          }`}
        style={{
          backgroundColor: "rgba(25, 25, 25, 0.98)", 
          borderColor: "rgba(89, 144, 125, 0.6)", 
          backdropFilter: "blur(20px)", 
          border: "2px solid",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(244, 202, 142, 0.2)", 
        }}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {mobileNavItems.map((item, index) => (
              <RetroButton
                key={item.id}
                item={item}
                isActive={activeSection === item.id}
                onClick={handleItemClick}
              />
            ))}
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-40" />
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => handleItemClick('')} // Closes the menu on backdrop click
        />
      )}
    </>
  );
};