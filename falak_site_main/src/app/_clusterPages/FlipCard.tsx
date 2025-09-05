'use client';
import { useState, MouseEvent } from 'react';

interface FlipCardProps {
    front: React.ReactNode;
    back: React.ReactNode;
    frontClassName?: string;
    backClassName?: string;
    containerClassName?: string;
}

export default function FlipCard({ front, back, frontClassName, backClassName, containerClassName }: FlipCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleCardClick = (e: MouseEvent) => {
        if (e.target instanceof HTMLElement && (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button'))) {
            return;
        }
        e.preventDefault();
        setIsFlipped(!isFlipped);
    };

    return (
        <div className={`flip-card ${containerClassName || ''}`} onClick={handleCardClick}>
            <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                <div className={`flip-card-front ${frontClassName || ''}`}>
                    {front}
                </div>
                <div className={`flip-card-back ${backClassName || ''}`}>
                    {back}
                </div>
            </div>
        </div>
    );
}