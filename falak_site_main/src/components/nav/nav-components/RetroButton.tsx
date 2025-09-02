import React from 'react';
import Link from 'next/link';
import { Press_Start_2P } from "next/font/google";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"] });

interface NavItem {
  id: string;
  label: string;
  href: string;
}

interface RetroButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: (id: string) => void;
  size?: 'sm' | 'md';
  /** If provided, overrides default navigation + onClick(id). */
  overrideAction?: () => void;
}

export const RetroButton: React.FC<RetroButtonProps> = ({ item, isActive, onClick, size = 'md', overrideAction }) => {
  const isMobile = size === 'sm';
  const paddingClass = isMobile ? 'px-2.5 py-1' : 'p-3';
  const textClass = isMobile ? 'text-xs' : 'text-xs';
  const roundedClass = isMobile ? 'rounded-md' : 'rounded-lg';
  const borderSize = isMobile ? '1.5px' : '2px';
  const activeScale = isMobile ? 'scale-105' : 'scale-105';
  
  return (
    <Link
      key={item.id}
      href={item.href}
      onClick={(e) => {
        if (overrideAction) {
          e.preventDefault();
          overrideAction();
          return;
        }
        onClick(item.id);
      }}
      className={`group relative ${paddingClass} ${roundedClass} ${textClass} font-bold uppercase flex justify-center items-center transition-all duration-300 ${press.className}
        ${isActive ? activeScale + ' z-10' : "hover:scale-102"}`}
      style={{
        backgroundColor: isActive ? "#D24A58" : "#59907D", 
        color: isActive ? "#fff" : "#F4CA8E", 
        border: `${borderSize} solid ${isActive ? "#F4CA8E" : "#191919"}`, 
        boxShadow: isActive
          ? "0 0 12px rgba(210, 74, 88, 0.6), 0 2px 4px rgba(0,0,0,0.3)"
          : "0 1px 2px rgba(0,0,0,0.2)",
      }}
    >
      <div className="relative z-10">{item.label}</div>
      {isActive && (
        <>
          <div
            className={`absolute inset-0 ${roundedClass} opacity-30`}
            style={{
              backgroundColor: "#F4CA8E", 
              filter: "blur(4px)",
            }}
          />
          <div className={`absolute inset-0 ${roundedClass} border-2 opacity-50 animate-pulse`} 
            style={{ borderColor: "#F4CA8E" }} />
        </>
      )}
      <div className={`absolute inset-0 ${roundedClass} opacity-0 group-hover:opacity-10 transition-opacity duration-200`}
        style={{ backgroundColor: "#D24A58" }} />
    </Link>
  );
};