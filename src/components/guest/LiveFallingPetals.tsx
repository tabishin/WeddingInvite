import React, { useEffect, useRef, useState } from 'react';
import { WeddingTheme } from '../../types/wedding';

interface LiveFallingPetalsProps {
  theme: WeddingTheme;
}

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  color: string;
  type: 'rose' | 'marigold' | 'lilac' | 'jasmine' | 'leaf' | 'sparkle' | 'butterfly';
  swayAmplitude: number;
  swaySpeed: number;
  swayOffset: number;
}

export const LiveFallingPetals: React.FC<LiveFallingPetalsProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [interactiveCount, setInteractiveCount] = useState(0);
  const particleType = theme.decorations.particleType;

  useEffect(() => {
    if (particleType === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palettes based on theme particle type
    const getPetalColors = () => {
      switch (particleType) {
        case 'marigold-petals':
          return ['#FFA000', '#FF8F00', '#FFB300', '#F57C00', '#FFD54F', '#E65100']; // Saffron & Golden Marigold
        case 'lilac-petals':
          return ['#C084FC', '#A855F7', '#E9D5FF', '#D8B4FE', '#9333EA', '#F3E8FF']; // Soft lilac & lavender
        case 'botanical-leaves':
          return ['#F7FEE7', '#ECFCCB', '#FEF08A', '#D9F99D', '#FEF9C3', '#84CC16']; // Magnolia white & mimosa yellow
        case 'sparkles':
        case 'sparkle-rain':
        case 'stars':
          return [theme.colors.goldOrMetallic, '#FDE047', '#FEF08A', '#F59E0B', '#FFFBEB'];
        case 'leaves':
          return ['#15803D', '#166534', '#4ADE80', '#22C55E', '#86EFAC'];
        case 'petals':
        default:
          return [
            theme.colors.primary,
            theme.colors.secondary,
            '#F472B6',
            '#FB7185',
            '#FDA4AF',
            '#FFF1F2',
          ];
      }
    };

    const colors = getPetalColors();
    const petalCount = window.innerWidth < 768 ? 24 : 38;

    const createPetal = (isInitial = false): Petal => {
      const pColors = colors;
      const color = pColors[Math.floor(Math.random() * pColors.length)];
      
      let type: Petal['type'] = 'rose';
      if (particleType === 'marigold-petals') {
        type = Math.random() > 0.3 ? 'marigold' : 'leaf';
      } else if (particleType === 'lilac-petals') {
        type = Math.random() > 0.85 ? 'butterfly' : 'lilac';
      } else if (particleType === 'botanical-leaves') {
        type = Math.random() > 0.5 ? 'jasmine' : 'leaf';
      } else if (particleType === 'sparkles' || particleType === 'sparkle-rain' || particleType === 'stars') {
        type = 'sparkle';
      } else if (particleType === 'leaves') {
        type = 'leaf';
      }

      return {
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : -20 - Math.random() * 50,
        size: Math.random() * 12 + 10,
        speedY: Math.random() * 1.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.03 + 0.01,
        opacity: Math.random() * 0.4 + 0.5,
        color,
        type,
        swayAmplitude: Math.random() * 25 + 15,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
      };
    };

    const petals: Petal[] = Array.from({ length: petalCount }, () => createPetal(true));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 1;

      petals.forEach((p, index) => {
        p.y += p.speedY;
        p.x += Math.sin(time * p.swaySpeed + p.swayOffset) * 0.8 + p.speedX;
        p.rotation += p.rotSpeed;
        p.flip += p.flipSpeed;

        // Reset when fallen off screen
        if (p.y > height + 30 || p.x < -40 || p.x > width + 40) {
          petals[index] = createPetal(false);
          return;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(Math.sin(p.flip), 1);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'sparkle') {
          // Draw sparkling star
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const s = p.size * 0.5;
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else if (p.type === 'butterfly') {
          // Soft watercolor butterfly flutter
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(-p.size * 0.4, -p.size * 0.2, p.size * 0.5, p.size * 0.35, -0.4, 0, Math.PI * 2);
          ctx.ellipse(p.size * 0.4, -p.size * 0.2, p.size * 0.5, p.size * 0.35, 0.4, 0, Math.PI * 2);
          ctx.ellipse(-p.size * 0.3, p.size * 0.2, p.size * 0.35, p.size * 0.25, 0.3, 0, Math.PI * 2);
          ctx.ellipse(p.size * 0.3, p.size * 0.2, p.size * 0.35, p.size * 0.25, -0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'marigold') {
          // Genda Phool / Marigold floret
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const r1 = p.size * 0.7;
            const r2 = p.size * 0.35;
            ctx.ellipse(Math.cos(angle) * r1, Math.sin(angle) * r1, r2, r2 * 0.6, angle, 0, Math.PI * 2);
          }
          ctx.fill();
          // Darker orange core
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'jasmine' || p.type === 'lilac') {
          // Delicate 4-petal flower floret
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.ellipse(Math.cos(angle) * p.size * 0.5, Math.sin(angle) * p.size * 0.5, p.size * 0.35, p.size * 0.2, angle, 0, Math.PI * 2);
          }
          ctx.fill();
        } else if (p.type === 'leaf') {
          // Graceful eucalyptus / olive leaf
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.25, 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Natural curved rose petal
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.6);
          ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.4, p.size * 0.7, p.size * 0.4, 0, p.size * 0.7);
          ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.4, -p.size * 0.6, -p.size * 0.4, 0, -p.size * 0.6);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme.id, particleType]);

  // Handle click on screen to release interactive burst of petals
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setInteractiveCount((c) => c + 1);
  };

  if (particleType === 'none') {
    return null;
  }

  return (
    <div 
      onClick={handleCanvasClick}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
