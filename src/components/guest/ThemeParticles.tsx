import React from 'react';
import { WeddingTheme, BirdAnimationType } from '../../types/wedding';
import { LiveFallingPetals } from './LiveFallingPetals';
import { LiveBirdsFlying } from './LiveBirdsFlying';

interface ThemeParticlesProps {
  theme: WeddingTheme;
}

export const ThemeParticles: React.FC<ThemeParticlesProps> = ({ theme }) => {
  const particleType = theme.decorations.particleType;
  const birdAnimation = theme.birdAnimation || (
    particleType === 'white-doves' ? 'white-doves' :
    particleType === 'royal-parrots' ? 'royal-parrots' :
    particleType === 'golden-cranes' ? 'golden-cranes' :
    particleType === 'flying-birds' ? 'flying-birds' :
    particleType === 'birds-and-petals' ? 'white-doves' :
    undefined
  );

  // Pre-generate ambient background depth particles
  const ambientParticles = [
    { left: '6%', top: '15%', size: '20px', delay: '0s', duration: '16s', opacity: 0.45 },
    { left: '90%', top: '18%', size: '22px', delay: '1.5s', duration: '18s', opacity: 0.5 },
    { left: '12%', top: '70%', size: '24px', delay: '3s', duration: '20s', opacity: 0.4 },
    { left: '86%', top: '78%', size: '20px', delay: '2s', duration: '17s', opacity: 0.45 },
    { left: '48%', top: '8%', size: '16px', delay: '4s', duration: '14s', opacity: 0.35 },
  ];

  const getAmbientContent = () => {
    switch (particleType) {
      case 'marigold-petals':
        return <span className="select-none pointer-events-none text-amber-500">🌼</span>;
      case 'lilac-petals':
        return <span className="select-none pointer-events-none text-purple-400">🌸</span>;
      case 'botanical-leaves':
        return <span className="select-none pointer-events-none text-emerald-400">🌿</span>;
      case 'white-doves':
      case 'birds-and-petals':
        return <span className="select-none pointer-events-none">🕊️</span>;
      case 'royal-parrots':
        return <span className="select-none pointer-events-none">🦜</span>;
      case 'golden-cranes':
        return <span className="select-none pointer-events-none">🪶</span>;
      case 'petals':
        return <span className="select-none pointer-events-none" style={{ color: theme.colors.primary }}>🌸</span>;
      case 'sparkles':
      case 'sparkle-rain':
        return <span className="select-none pointer-events-none" style={{ color: theme.colors.goldOrMetallic }}>✨</span>;
      case 'stars':
        return <span className="select-none pointer-events-none" style={{ color: theme.colors.goldOrMetallic }}>⭐</span>;
      case 'leaves':
        return <span className="select-none pointer-events-none" style={{ color: theme.colors.primary }}>🍃</span>;
      case 'champagne-bubbles':
        return <span className="inline-block w-3.5 h-3.5 rounded-full border border-amber-300/80 bg-amber-100/40 select-none pointer-events-none" />;
      case 'snowflakes':
        return <span className="select-none pointer-events-none" style={{ color: theme.colors.primary }}>❄️</span>;
      default:
        return null;
    }
  };

  const shouldRenderPetals = particleType !== 'none' && particleType !== 'white-doves' && particleType !== 'royal-parrots' && particleType !== 'golden-cranes' && particleType !== 'flying-birds';

  return (
    <>
      {/* Live Falling Canvas Animation Engine */}
      {shouldRenderPetals && <LiveFallingPetals theme={theme} />}

      {/* Live Flying Birds Canvas Engine */}
      {birdAnimation && birdAnimation !== 'none' && (
        <LiveBirdsFlying
          birdType={birdAnimation}
          primaryColor={theme.colors.primary}
          goldColor={theme.colors.goldOrMetallic}
          density="medium"
        />
      )}

      {/* Floating Ambient Depth Elements */}
      {particleType !== 'none' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {ambientParticles.map((p, idx) => (
            <div
              key={idx}
              className="absolute animate-float-slow"
              style={{
                left: p.left,
                top: p.top,
                fontSize: p.size,
                opacity: p.opacity,
                animationDelay: p.delay,
                animationDuration: p.duration,
                filter: particleType === 'stars' || particleType === 'sparkles' 
                  ? `drop-shadow(0 0 6px ${theme.colors.goldOrMetallic})` 
                  : undefined,
              }}
            >
              {getAmbientContent()}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

