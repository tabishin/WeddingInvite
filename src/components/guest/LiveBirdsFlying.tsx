import React, { useEffect, useRef } from 'react';
import { BirdAnimationType } from '../../types/wedding';

interface LiveBirdsFlyingProps {
  birdType?: BirdAnimationType;
  primaryColor?: string;
  goldColor?: string;
  density?: 'sparse' | 'medium' | 'lush';
  className?: string;
}

interface Bird {
  x: number;
  y: number;
  scale: number;
  speedX: number;
  speedY: number;
  direction: 1 | -1; // 1 = flying right, -1 = flying left
  wingAngle: number;
  wingSpeed: number;
  glideTimer: number;
  isGliding: boolean;
  elevationWave: number;
  elevationSpeed: number;
  opacity: number;
  flockIndex: number;
}

export const LiveBirdsFlying: React.FC<LiveBirdsFlyingProps> = ({
  birdType = 'white-doves',
  primaryColor = '#E11D48',
  goldColor = '#D4AF37',
  density = 'medium',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (birdType === 'none') return;

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

    const totalBirds = density === 'sparse' ? 4 : density === 'lush' ? 10 : 6;

    const createBird = (isInitial = false, customX?: number, customY?: number): Bird => {
      const direction: 1 | -1 = Math.random() > 0.35 ? 1 : -1;
      const baseScale = Math.random() * 0.45 + 0.55; // 0.55 to 1.0

      // Natural flight speed
      const baseSpeed = (Math.random() * 1.2 + 1.6) * (direction === 1 ? 1 : -1);

      return {
        x: customX !== undefined 
          ? customX 
          : isInitial 
            ? Math.random() * width 
            : direction === 1 
              ? -80 - Math.random() * 120 
              : width + 80 + Math.random() * 120,
        y: customY !== undefined 
          ? customY 
          : Math.random() * (height * 0.55) + 30,
        scale: baseScale,
        speedX: baseSpeed,
        speedY: (Math.random() - 0.5) * 0.4,
        direction,
        wingAngle: Math.random() * Math.PI * 2,
        wingSpeed: Math.random() * 0.12 + 0.14,
        glideTimer: 0,
        isGliding: false,
        elevationWave: Math.random() * Math.PI * 2,
        elevationSpeed: Math.random() * 0.02 + 0.015,
        opacity: Math.random() * 0.25 + 0.75,
        flockIndex: Math.floor(Math.random() * 3),
      };
    };

    const birds: Bird[] = [];
    for (let i = 0; i < totalBirds; i++) {
      // Create in pairs / small flocks for realism
      const b = createBird(true);
      if (i % 2 === 1 && birds[i - 1]) {
        // Follow closely behind the partner bird
        b.x = birds[i - 1].x - 45 * birds[i - 1].direction;
        b.y = birds[i - 1].y + (Math.random() * 30 - 15);
        b.direction = birds[i - 1].direction;
        b.speedX = birds[i - 1].speedX;
      }
      birds.push(b);
    }

    // Draw White Peace Dove
    const drawWhiteDove = (b: Bird, wingPos: number) => {
      ctx.save();
      // Dove body
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 4 * b.scale;
      ctx.shadowOffsetY = 2 * b.scale;

      // Body ellipsoid
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * b.scale, 5 * b.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & delicate beak
      ctx.beginPath();
      ctx.arc(14 * b.scale, -2 * b.scale, 4.5 * b.scale, 0, Math.PI * 2);
      ctx.fill();

      // Golden/orange beak
      ctx.fillStyle = goldColor || '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(18 * b.scale, -2 * b.scale);
      ctx.lineTo(23 * b.scale, -1 * b.scale);
      ctx.lineTo(18 * b.scale, 0);
      ctx.closePath();
      ctx.fill();

      // Auspicious olive branch or floral sprig in beak (50% chance)
      if (b.flockIndex === 0) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.2 * b.scale;
        ctx.beginPath();
        ctx.moveTo(21 * b.scale, -1 * b.scale);
        ctx.quadraticCurveTo(27 * b.scale, 3 * b.scale, 30 * b.scale, 1 * b.scale);
        ctx.stroke();

        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.ellipse(25 * b.scale, 2 * b.scale, 2.5 * b.scale, 1.2 * b.scale, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tail with spread feathers
      ctx.fillStyle = '#FAFAFA';
      ctx.beginPath();
      ctx.moveTo(-12 * b.scale, -1 * b.scale);
      ctx.lineTo(-26 * b.scale, -4 * b.scale);
      ctx.lineTo(-23 * b.scale, 0);
      ctx.lineTo(-26 * b.scale, 4 * b.scale);
      ctx.lineTo(-12 * b.scale, 2 * b.scale);
      ctx.closePath();
      ctx.fill();

      // Wings with natural flap curvature
      ctx.fillStyle = '#FFFFFF';
      const wingTipY = wingPos * 22 * b.scale;
      const wingArchY = wingPos * 12 * b.scale;

      // Far wing (subtly darker shading for 3D depth)
      ctx.fillStyle = '#F0F0F0';
      ctx.beginPath();
      ctx.moveTo(-2 * b.scale, -2 * b.scale);
      ctx.quadraticCurveTo(6 * b.scale, wingArchY - 14 * b.scale, 10 * b.scale, wingTipY - 18 * b.scale);
      ctx.quadraticCurveTo(1 * b.scale, wingArchY - 8 * b.scale, -6 * b.scale, -1 * b.scale);
      ctx.closePath();
      ctx.fill();

      // Near wing
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-3 * b.scale, 0);
      ctx.quadraticCurveTo(5 * b.scale, wingArchY - 18 * b.scale, 9 * b.scale, wingTipY - 24 * b.scale);
      ctx.quadraticCurveTo(0, wingArchY - 10 * b.scale, -8 * b.scale, 1 * b.scale);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Draw Royal Indian Parrots (Tota / Parakeet - traditional royal wedding motif)
    const drawRoyalParrot = (b: Bird, wingPos: number) => {
      ctx.save();
      // Emerald Green body
      ctx.fillStyle = '#10B981';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.25)';
      ctx.shadowBlur = 5 * b.scale;

      ctx.beginPath();
      ctx.ellipse(0, 0, 15 * b.scale, 5.5 * b.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(13 * b.scale, -2 * b.scale, 5 * b.scale, 0, Math.PI * 2);
      ctx.fill();

      // Curved scarlet red beak
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.moveTo(17 * b.scale, -3 * b.scale);
      ctx.quadraticCurveTo(23 * b.scale, -1 * b.scale, 20 * b.scale, 3 * b.scale);
      ctx.lineTo(16 * b.scale, 0);
      ctx.closePath();
      ctx.fill();

      // Long graceful parakeet tail feathers
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(-11 * b.scale, -1 * b.scale);
      ctx.quadraticCurveTo(-24 * b.scale, 2 * b.scale, -34 * b.scale, 4 * b.scale);
      ctx.quadraticCurveTo(-22 * b.scale, 0, -11 * b.scale, 2 * b.scale);
      ctx.closePath();
      ctx.fill();

      // Wings with turquoise & chartreuse tips
      const wingTipY = wingPos * 22 * b.scale;
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.moveTo(-2 * b.scale, 0);
      ctx.quadraticCurveTo(6 * b.scale, wingPos * 10 * b.scale - 16 * b.scale, 9 * b.scale, wingTipY - 24 * b.scale);
      ctx.quadraticCurveTo(0, wingPos * 8 * b.scale - 8 * b.scale, -7 * b.scale, 1 * b.scale);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Draw Golden Imperial Crane (Symbol of longevity, auspicious devotion, royalty)
    const drawGoldenCrane = (b: Bird, wingPos: number) => {
      ctx.save();
      // Burnished gold & champagne body
      ctx.fillStyle = goldColor || '#D4AF37';
      ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
      ctx.shadowBlur = 6 * b.scale;

      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * b.scale, 4.5 * b.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slender graceful crane neck & head
      ctx.beginPath();
      ctx.moveTo(12 * b.scale, -1 * b.scale);
      ctx.quadraticCurveTo(22 * b.scale, -6 * b.scale, 26 * b.scale, -4 * b.scale);
      ctx.lineTo(24 * b.scale, -2 * b.scale);
      ctx.quadraticCurveTo(16 * b.scale, -1 * b.scale, 12 * b.scale, 2 * b.scale);
      ctx.closePath();
      ctx.fill();

      // Long dagger beak
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.moveTo(26 * b.scale, -4 * b.scale);
      ctx.lineTo(34 * b.scale, -3 * b.scale);
      ctx.lineTo(26 * b.scale, -2 * b.scale);
      ctx.closePath();
      ctx.fill();

      // Long trailing legs
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 1 * b.scale;
      ctx.beginPath();
      ctx.moveTo(-14 * b.scale, 2 * b.scale);
      ctx.lineTo(-32 * b.scale, 5 * b.scale);
      ctx.moveTo(-13 * b.scale, 0);
      ctx.lineTo(-30 * b.scale, 3 * b.scale);
      ctx.stroke();

      // Wide expansive wings
      const wingTipY = wingPos * 26 * b.scale;
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(-4 * b.scale, 0);
      ctx.quadraticCurveTo(8 * b.scale, wingPos * 12 * b.scale - 20 * b.scale, 12 * b.scale, wingTipY - 30 * b.scale);
      ctx.quadraticCurveTo(2 * b.scale, wingPos * 8 * b.scale - 12 * b.scale, -10 * b.scale, 1 * b.scale);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Draw Golden Sparrows / Swallows (Delicate, swift, joyful)
    const drawSparrow = (b: Bird, wingPos: number) => {
      ctx.save();
      ctx.fillStyle = goldColor || '#F59E0B';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.2)';
      ctx.shadowBlur = 4 * b.scale;

      ctx.beginPath();
      ctx.ellipse(0, 0, 12 * b.scale, 4 * b.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(10 * b.scale, -1.5 * b.scale, 3.5 * b.scale, 0, Math.PI * 2);
      ctx.fill();

      // Forked swallow tail
      ctx.beginPath();
      ctx.moveTo(-10 * b.scale, -1 * b.scale);
      ctx.lineTo(-20 * b.scale, -4 * b.scale);
      ctx.lineTo(-16 * b.scale, 0);
      ctx.lineTo(-20 * b.scale, 4 * b.scale);
      ctx.lineTo(-10 * b.scale, 1 * b.scale);
      ctx.closePath();
      ctx.fill();

      // Wings
      const wingTipY = wingPos * 18 * b.scale;
      ctx.beginPath();
      ctx.moveTo(-2 * b.scale, 0);
      ctx.quadraticCurveTo(4 * b.scale, wingPos * 8 * b.scale - 12 * b.scale, 8 * b.scale, wingTipY - 20 * b.scale);
      ctx.quadraticCurveTo(0, wingPos * 6 * b.scale - 6 * b.scale, -6 * b.scale, 1 * b.scale);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      birds.forEach((b, index) => {
        // Update flight coordinates
        b.x += b.speedX;
        b.elevationWave += b.elevationSpeed;
        b.y += Math.sin(b.elevationWave) * 0.7 + b.speedY;

        // Wing flap mechanics with realistic glide pauses
        b.glideTimer += 1;
        if (b.glideTimer > 180) {
          b.isGliding = Math.random() > 0.4;
          b.glideTimer = 0;
        }

        if (!b.isGliding) {
          b.wingAngle += b.wingSpeed;
        } else {
          // Slow subtle hover glide
          b.wingAngle += b.wingSpeed * 0.15;
        }

        const wingPos = Math.sin(b.wingAngle); // -1 to 1

        // Wrap around when off screen
        if (b.direction === 1 && b.x > width + 100) {
          birds[index] = createBird(false);
          return;
        } else if (b.direction === -1 && b.x < -100) {
          birds[index] = createBird(false);
          return;
        }

        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.translate(b.x, b.y);

        // Orient bird towards flight direction
        if (b.direction === -1) {
          ctx.scale(-1, 1);
        }

        // Slight tilt based on elevation ascent/descent
        const tilt = Math.sin(b.elevationWave) * 0.12;
        ctx.rotate(tilt);

        // Draw bird based on configured species
        if (birdType === 'royal-parrots') {
          drawRoyalParrot(b, wingPos);
        } else if (birdType === 'golden-cranes') {
          drawGoldenCrane(b, wingPos);
        } else if (birdType === 'golden-sparrows') {
          drawSparrow(b, wingPos);
        } else {
          // 'white-doves' or general 'flying-birds'
          drawWhiteDove(b, wingPos);
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Interactive flock trigger on user click/tap
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      // Add a couple of startled, joyful birds fluttering upward from tap location
      birds.push(createBird(true, clientX - 10, clientY - 15));
      birds.push(createBird(true, clientX + 15, clientY - 30));
      if (birds.length > totalBirds + 4) {
        birds.splice(0, 2);
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [birdType, primaryColor, goldColor, density]);

  if (birdType === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-10 select-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
