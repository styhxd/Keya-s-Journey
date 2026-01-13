
import React, { useMemo } from 'react';

interface FadingWordTextProps {
    text: string;
}

export const FadingWordText: React.FC<FadingWordTextProps> = ({ text }) => {
    const parts = useMemo(() => {
        const regex = /(\*.*?\*)/g;
        return text.split(regex).filter(Boolean).map((part, index) => {
            // In a split with a capturing group, the captured delimiters will be at odd indices.
            const isHighlighted = index % 2 === 1;
            return {
                text: isHighlighted ? part.slice(1, -1) : part,
                highlighted: isHighlighted,
            };
        });
    }, [text]);

    let delay = 0;

    return (
        <p className="fade-in-text">
            {parts.map((part, partIndex) => {
                const words = part.text.split(/(\s+)/);
                return words.map((word, wordIndex) => {
                    if (word.trim() === '') {
                        return <span key={`${partIndex}-${wordIndex}`}>{word}</span>;
                    }
                    
                    const currentDelay = delay;
                    delay += 0.05;

                    return (
                        <span 
                            key={`${partIndex}-${wordIndex}`}
                            style={{ animationDelay: `${currentDelay}s` }} 
                            className={part.highlighted ? 'highlighted' : ''}
                        >
                            {word}
                        </span>
                    );
                });
            })}
        </p>
    );
};
