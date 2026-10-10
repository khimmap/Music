// File: effect.js
// Thư viện hiệu ứng GSAP Cinematic cho lyric video

const GSAP_EFFECTS = [
    /* 1. Trượt từ dưới lên mờ ảo */
    { in: { y: 60, opacity: 0 }, out: { y: -60, opacity: 0 } },
    /* 2. Trượt từ trên xuống */
    { in: { y: -60, opacity: 0 }, out: { y: 60, opacity: 0 } },
    /* 3. Lướt từ trái sang phải */
    { in: { x: -80, opacity: 0 }, out: { x: 80, opacity: 0 } },
    /* 4. Lướt từ phải sang trái */
    { in: { x: 80, opacity: 0 }, out: { x: -80, opacity: 0 } },
    /* 5. Phóng to từ từ (Zoom In) */
    { in: { scale: 0.5, opacity: 0 }, out: { scale: 1.5, opacity: 0 } },
    /* 6. Thu nhỏ từ từ (Zoom Out) */
    { in: { scale: 1.5, opacity: 0 }, out: { scale: 0.8, opacity: 0 } },
    /* 7. Từ mờ nhòe thành rõ (Blur Reveal) */
    { in: { filter: "blur(20px)", opacity: 0, scale: 1.1 }, out: { filter: "blur(10px)", opacity: 0 } },
    /* 8. Rơi xuống kết hợp mờ nhòe */
    { in: { filter: "blur(15px)", y: 40, opacity: 0 }, out: { filter: "blur(15px)", y: -40, opacity: 0 } },
    /* 9. Lật 3D theo trục X */
    { in: { rotationX: -90, opacity: 0, transformPerspective: 600 }, out: { rotationX: 90, opacity: 0 } },
    /* 10. Lật 3D theo trục Y */
    { in: { rotationY: -90, opacity: 0, transformPerspective: 600 }, out: { rotationY: 90, opacity: 0 } },
    /* 11. Xoay nghiêng nhẹ nhàng (Spin) */
    { in: { rotation: 15, x: -30, opacity: 0 }, out: { rotation: -15, x: 30, opacity: 0 } },
    /* 12. Rơi nảy lên (Bounce) */
    { in: { y: -100, opacity: 0, ease: "bounce.out" }, out: { y: 100, opacity: 0, ease: "power2.in" } },
    /* 13. Bung nảy cao su (Elastic) */
    { in: { scale: 0.2, opacity: 0, ease: "elastic.out(1, 0.4)" }, out: { scale: 0, opacity: 0 } },
    /* 14. Trượt chéo biến dạng (Skew) */
    { in: { skewX: 20, x: -50, opacity: 0 }, out: { skewX: -20, x: 50, opacity: 0 } },
    /* 15. Phối cảnh không gian góc trái */
    { in: { x: -100, rotationY: 45, opacity: 0 }, out: { x: 100, rotationY: -45, opacity: 0 } },
    /* 16. Phối cảnh không gian góc phải */
    { in: { x: 100, rotationY: -45, opacity: 0 }, out: { x: -100, rotationY: 45, opacity: 0 } },
    /* 17. Trôi nổi siêu chậm (Slow Pan) */
    { in: { x: -20, scale: 1.05, opacity: 0, duration: 2 }, out: { x: 20, scale: 1, opacity: 0 } },
    /* 18. Nổi lên chói lóa (Glow Brightness) */
    { in: { y: 30, filter: "brightness(2.5)", opacity: 0 }, out: { filter: "brightness(0)", opacity: 0 } },
    /* 19. Rơi ịch xuống màn hình */
    { in: { y: -150, scale: 2, opacity: 0 }, out: { y: 150, scale: 0.5, opacity: 0 } },
    /* 20. Khung hình nghiêng điện ảnh */
    { in: { rotationZ: -5, scale: 1.2, opacity: 0 }, out: { rotationZ: 5, scale: 0.8, opacity: 0 } },
    /* 21. Mờ hiện tối giản */
    { in: { opacity: 0 }, out: { opacity: 0 } },
    /* 22. Zoom điện ảnh kèm blur */
    { in: { scale: 1.35, filter: "blur(18px)", opacity: 0 }, out: { scale: 0.92, filter: "blur(12px)", opacity: 0 } },
    /* 23. Quét chéo từ góc trên trái */
    { in: { x: -120, y: -70, rotationZ: -8, opacity: 0 }, out: { x: 120, y: 70, rotationZ: 8, opacity: 0 } },
    /* 24. Quét chéo từ góc dưới phải */
    { in: { x: 120, y: 70, rotationZ: 8, opacity: 0 }, out: { x: -120, y: -70, rotationZ: -8, opacity: 0 } },
    /* 25. Xoay toàn vòng */
    { in: { rotation: -360, scale: 0.5, opacity: 0 }, out: { rotation: 360, scale: 1.25, opacity: 0 } },
    /* 26. Cửa mở 3D */
    { in: { rotationY: -100, transformOrigin: "left center", opacity: 0, transformPerspective: 900 }, out: { rotationY: 100, transformOrigin: "right center", opacity: 0 } },
    /* 27. Nảy từ cạnh trái */
    { in: { x: -220, opacity: 0, ease: "back.out(1.7)" }, out: { x: 220, opacity: 0, ease: "back.in(1.7)" } },
    /* 28. Nảy từ cạnh phải */
    { in: { x: 220, opacity: 0, ease: "back.out(1.7)" }, out: { x: -220, opacity: 0, ease: "back.in(1.7)" } },
    /* 29. Lắc nhịp nhẹ */
    { in: { rotation: -12, scale: 0.85, opacity: 0 }, out: { rotation: 12, scale: 1.12, opacity: 0 } },
    /* 30. Ép ngang rồi bung ra */
    { in: { scaleX: 0.05, scaleY: 1.15, opacity: 0 }, out: { scaleX: 1.5, scaleY: 0.9, opacity: 0 } },
    /* 31. Ép dọc rồi bung ra */
    { in: { scaleX: 1.15, scaleY: 0.05, opacity: 0 }, out: { scaleX: 0.9, scaleY: 1.5, opacity: 0 } },
    /* 32. Sáng lóe */
    { in: { y: 24, filter: "brightness(4) blur(3px)", opacity: 0 }, out: { y: -24, filter: "brightness(0.3) blur(4px)", opacity: 0 } },
    /* 33. Trượt có độ nén */
    { in: { x: -100, skewX: 35, scaleX: 1.3, opacity: 0 }, out: { x: 100, skewX: -35, scaleX: 0.8, opacity: 0 } },
    /* 34. Rơi xoắn */
    { in: { y: -130, rotation: -25, scale: 0.7, opacity: 0 }, out: { y: 130, rotation: 25, scale: 1.2, opacity: 0 } },
    /* 35. Nhịp thở mềm */
    { in: { scale: 0.8, filter: "blur(8px)", opacity: 0 }, out: { scale: 1.18, filter: "blur(5px)", opacity: 0 } },
    /* 36. Vặn nghiêng không gian */
    { in: { rotationX: 55, rotationY: -35, z: -180, opacity: 0, transformPerspective: 800 }, out: { rotationX: -55, rotationY: 35, z: 180, opacity: 0 } },
    /* 37. Mask quét ngang */
    { in: { clipPath: 'inset(0 100% 0 0)', opacity: 0 }, out: { clipPath: 'inset(0 0 0 100%)', opacity: 0 } },
    /* 38. Mask quét dọc */
    { in: { clipPath: 'inset(100% 0 0 0)', opacity: 0 }, out: { clipPath: 'inset(0 0 100% 0)', opacity: 0 } },
    /* 39. Reveal từ tâm */
    { in: { clipPath: 'inset(0 50% 0 50%)', scale: 1.12, opacity: 0 }, out: { clipPath: 'inset(0 50% 0 50%)', scale: 0.94, opacity: 0 } },
    /* 40. Cắt góc editorial */
    { in: { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', x: -30, opacity: 0 }, out: { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)', x: 30, opacity: 0 } },
    /* 41. Glitch RGB */
    { in: { x: -18, skewX: 16, textShadow: '12px 0 #ff0055, -12px 0 #00f0ff', opacity: 0 }, out: { x: 18, skewX: -16, textShadow: '-12px 0 #ff0055, 12px 0 #00f0ff', opacity: 0 } },
    /* 42. Glitch rung */
    { in: { y: -12, skewX: -25, filter: 'contrast(2) saturate(2)', textShadow: '5px 0 #7df9ff', opacity: 0 }, out: { y: 12, skewX: 25, filter: 'contrast(2) saturate(2)', textShadow: '-5px 0 #ff4ecd', opacity: 0 } },
    /* 43. Neon flicker */
    { in: { opacity: 0, textShadow: '0 0 0 transparent' }, out: { opacity: 0, textShadow: '0 0 38px currentColor' } },
    /* 44. Laser focus */
    { in: { scaleX: 0.01, filter: 'blur(12px) brightness(2)', opacity: 0 }, out: { scaleX: 1.4, filter: 'blur(7px) brightness(1.8)', opacity: 0 } },
    /* 45. Vertical stretch */
    { in: { scaleY: 3, scaleX: 0.45, filter: 'blur(4px)', opacity: 0 }, out: { scaleY: 0.45, scaleX: 1.25, filter: 'blur(3px)', opacity: 0 } },
    /* 46. Squeeze spotlight */
    { in: { scaleX: 2.2, scaleY: 0.08, opacity: 0 }, out: { scaleX: 0.65, scaleY: 1.35, opacity: 0 } },
    /* 47. Orbit 3D */
    { in: { x: -100, rotationY: -75, rotationX: 28, z: -320, opacity: 0, transformPerspective: 1000 }, out: { x: 100, rotationY: 75, rotationX: -28, z: 160, opacity: 0 } },
    /* 48. Rơi lật gập */
    { in: { y: -180, rotationX: -180, transformOrigin: 'top center', opacity: 0, transformPerspective: 900 }, out: { y: 180, rotationX: 180, transformOrigin: 'bottom center', opacity: 0 } },
    /* 49. Hất ngang 3D */
    { in: { x: -180, rotationY: 110, transformOrigin: 'right center', opacity: 0, transformPerspective: 850 }, out: { x: 180, rotationY: -110, transformOrigin: 'left center', opacity: 0 } },
    /* 50. Floating card */
    { in: { y: 90, rotationZ: -7, scale: 0.78, filter: 'blur(10px)', opacity: 0 }, out: { y: -90, rotationZ: 7, scale: 1.16, filter: 'blur(8px)', opacity: 0 } },
    /* 51. Magnetic pull */
    { in: { scale: 0.08, rotation: -14, opacity: 0, ease: 'elastic.out(1.2, 0.32)' }, out: { scale: 2.2, rotation: 14, opacity: 0, ease: 'power3.in' } },
    /* 52. Bouncy tilt */
    { in: { y: 100, rotationZ: 18, scale: 0.72, opacity: 0, ease: 'back.out(2)' }, out: { y: -100, rotationZ: -18, scale: 1.18, opacity: 0, ease: 'back.in(2)' } },
    /* 53. Film burn */
    { in: { x: -45, filter: 'brightness(5) saturate(0.2) blur(6px)', opacity: 0 }, out: { x: 45, filter: 'brightness(0.4) saturate(2) blur(8px)', opacity: 0 } },
    /* 54. Infrared color shift */
    { in: { scale: 0.9, filter: 'hue-rotate(140deg) saturate(3) blur(6px)', opacity: 0 }, out: { scale: 1.08, filter: 'hue-rotate(-100deg) saturate(3) blur(5px)', opacity: 0 } },
    /* 55. Soft focus lens */
    { in: { scale: 1.28, filter: 'blur(24px) brightness(1.7)', opacity: 0 }, out: { scale: 0.9, filter: 'blur(16px) brightness(0.7)', opacity: 0 } },
    /* 56. Typewriter snap */
    { in: { x: -24, letterSpacing: '22px', filter: 'blur(2px)', opacity: 0 }, out: { x: 24, letterSpacing: '-4px', filter: 'blur(2px)', opacity: 0 } },
    /* 57. Pendulum reveal */
    { in: { rotationZ: -32, transformOrigin: 'top left', y: -30, opacity: 0 }, out: { rotationZ: 32, transformOrigin: 'top right', y: 30, opacity: 0 } },
    /* 58. Prism split */
    { in: { x: -22, rotationY: -22, textShadow: '18px 0 #ff3cac, -18px 0 #00f5d4', opacity: 0 }, out: { x: 22, rotationY: 22, textShadow: '-18px 0 #ff3cac, 18px 0 #00f5d4', opacity: 0 } },
    /* 59. Smoke drift */
    { in: { x: -60, y: 35, scale: 1.18, filter: 'blur(18px)', opacity: 0 }, out: { x: 60, y: -35, scale: 0.9, filter: 'blur(14px)', opacity: 0 } },
    /* 60. Kinetic impact */
    { in: { scale: 2.8, rotation: -4, filter: 'blur(2px) brightness(2.5)', opacity: 0, ease: 'power4.out' }, out: { scale: 0.6, rotation: 4, filter: 'blur(4px) brightness(0.5)', opacity: 0, ease: 'power4.in' } },
    /* 61. Ribbon wipe */
    { in: { x: -180, skewX: -35, clipPath: 'inset(0 100% 0 0)', opacity: 0 }, out: { x: 180, skewX: 35, clipPath: 'inset(0 0 0 100%)', opacity: 0 } },
    /* 62. Tunnel zoom */
    { in: { z: -700, rotationX: 18, scale: 0.2, opacity: 0, transformPerspective: 1200 }, out: { z: 300, rotationX: -18, scale: 1.35, opacity: 0 } },
    /* 63. Side camera slide */
    { in: { xPercent: -120, rotationY: 24, opacity: 0, transformPerspective: 900 }, out: { xPercent: 120, rotationY: -24, opacity: 0 } },
    /* 64. Vertical camera slide */
    { in: { yPercent: 120, rotationX: -20, opacity: 0, transformPerspective: 900 }, out: { yPercent: -120, rotationX: 20, opacity: 0 } },
    /* 65. Light streak */
    { in: { x: -260, scaleX: 2.4, filter: 'blur(9px) brightness(3)', opacity: 0 }, out: { x: 260, scaleX: 0.5, filter: 'blur(5px) brightness(0.4)', opacity: 0 } },
    /* 66. Lens snap */
    { in: { scale: 0.15, filter: 'blur(30px) brightness(2)', opacity: 0, ease: 'expo.out' }, out: { scale: 1.35, filter: 'blur(12px) brightness(0.5)', opacity: 0, ease: 'expo.in' } },
    /* 67. Liquid tilt */
    { in: { y: 80, rotationZ: -16, skewX: -12, scaleY: 0.7, opacity: 0 }, out: { y: -80, rotationZ: 16, skewX: 12, scaleY: 1.3, opacity: 0 } },
    /* 68. Paper fold */
    { in: { rotationX: -100, rotationY: -20, transformOrigin: 'bottom left', opacity: 0, transformPerspective: 1000 }, out: { rotationX: 100, rotationY: 20, transformOrigin: 'top right', opacity: 0 } },
    /* 69. Helix drift */
    { in: { x: -90, y: 70, rotation: -70, rotationY: -35, opacity: 0 }, out: { x: 90, y: -70, rotation: 70, rotationY: 35, opacity: 0 } },
    /* 70. Pulse reveal */
    { in: { scale: 0.3, opacity: 0, filter: 'brightness(2)' }, out: { scale: 1.25, opacity: 0, filter: 'brightness(0.6)' } },
    /* 71. Chromatic zoom */
    { in: { scale: 1.8, textShadow: '20px 0 #ff2d95, -20px 0 #00e5ff', filter: 'blur(5px)', opacity: 0 }, out: { scale: 0.82, textShadow: '-20px 0 #ff2d95, 20px 0 #00e5ff', filter: 'blur(4px)', opacity: 0 } },
    /* 72. Scanline reveal */
    { in: { y: -45, scaleY: 0.03, filter: 'contrast(2) brightness(1.8)', opacity: 0 }, out: { y: 45, scaleY: 1.8, filter: 'contrast(1.4) brightness(0.5)', opacity: 0 } },
    /* 73. Soft orbit */
    { in: { x: -75, y: 35, rotation: -8, scale: 0.88, opacity: 0 }, out: { x: 75, y: -35, rotation: 8, scale: 1.12, opacity: 0 } },
    /* 74. Gravity drop */
    { in: { y: -240, scaleY: 1.4, opacity: 0, ease: 'bounce.out' }, out: { y: 240, scaleY: 0.7, opacity: 0, ease: 'power4.in' } },
    /* 75. Split converge */
    { in: { x: -140, scaleX: 0.55, opacity: 0 }, out: { x: 140, scaleX: 1.45, opacity: 0 } },
    /* 76. Reverse split */
    { in: { x: 140, scaleX: 0.55, opacity: 0 }, out: { x: -140, scaleX: 1.45, opacity: 0 } },
    /* 77. Tilted prism */
    { in: { rotationZ: -22, rotationY: -40, x: -80, opacity: 0, transformPerspective: 1000 }, out: { rotationZ: 22, rotationY: 40, x: 80, opacity: 0 } },
    /* 78. Bloom focus */
    { in: { scale: 0.72, filter: 'blur(14px) saturate(3)', opacity: 0 }, out: { scale: 1.16, filter: 'blur(9px) saturate(0.4)', opacity: 0 } },
    /* 79. Hologram rise */
    { in: { y: 90, skewX: 8, filter: 'brightness(2) contrast(2)', textShadow: '0 8px #00e5ff', opacity: 0 }, out: { y: -90, skewX: -8, filter: 'brightness(0.5) contrast(1.5)', textShadow: '0 -8px #ff2d95', opacity: 0 } },
    /* 80. Elastic corner */
    { in: { x: -120, y: -120, rotation: -35, scale: 0.4, opacity: 0, ease: 'elastic.out(1, 0.3)' }, out: { x: 120, y: 120, rotation: 35, scale: 1.25, opacity: 0 } },
    /* 81. Neon smear */
    { in: { x: -70, filter: 'blur(20px) brightness(3)', textShadow: '0 0 40px currentColor', opacity: 0 }, out: { x: 70, filter: 'blur(12px) brightness(0.3)', textShadow: '0 0 0 transparent', opacity: 0 } },
    /* 82. Center aperture */
    { in: { clipPath: 'circle(0% at 50% 50%)', scale: 1.15, opacity: 0 }, out: { clipPath: 'circle(0% at 50% 50%)', scale: 0.9, opacity: 0 } },
    /* 83. Diagonal aperture */
    { in: { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', rotationZ: -12, opacity: 0 }, out: { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)', rotationZ: 12, opacity: 0 } },
    /* 84. Cinematic settle */
    { in: { y: 44, scale: 1.22, rotationZ: -3, filter: 'blur(7px)', opacity: 0, ease: 'power3.out' }, out: { y: -44, scale: 0.92, rotationZ: 3, filter: 'blur(6px)', opacity: 0, ease: 'power3.in' } }
];

// Hàm bốc thăm random 1 hiệu ứng từ thư viện
function getRandomEffect() {
    return GSAP_EFFECTS[Math.floor(Math.random() * GSAP_EFFECTS.length)];
}

function getEffectForDuration(duration) {
    const isGentle = entrance => !entrance.clipPath
        && !('z' in entrance)
        && Math.abs(entrance.x || 0) < 140
        && Math.abs(entrance.y || 0) < 140
        && Math.abs(entrance.xPercent || 0) < 90
        && Math.abs(entrance.yPercent || 0) < 90
        && Math.abs(entrance.rotationX || 0) < 70
        && Math.abs(entrance.rotationY || 0) < 70
        && (entrance.scale || 1) > 0.35
        && (entrance.scale || 1) < 1.8;
    const gentleEffects = GSAP_EFFECTS.filter(effect => {
        return isGentle(effect.in) && isGentle(effect.out);
    });
    const source = duration < 2.8 ? gentleEffects : GSAP_EFFECTS;
    const effect = source[Math.floor(Math.random() * source.length)];
    return Math.random() > 0.5 ? effect : { in: effect.out, out: effect.in };
}

// Layout, typography và palette được bốc theo từng scene lyric.
const LAYOUT_TYPES = [
    'layout-centered', 'layout-diagonal-left', 'layout-diagonal-right',
    'layout-upper-left', 'layout-upper-right', 'layout-lower-left',
    'layout-lower-right', 'layout-center-wide', 'layout-mid-left',
    'layout-mid-right', 'layout-top-wide', 'layout-bottom-wide',
    'layout-corner-top-left', 'layout-corner-bottom-right'
];

const FONT_TYPES = [
    'font-serif', 'font-script', 'font-display', 'font-modern',
    'font-editorial', 'font-mono', 'font-hand', 'font-condensed',
    'font-rounded', 'font-stamp', 'font-italic', 'font-sora',
    'font-anton', 'font-bungee', 'font-lora', 'font-merriweather',
    'font-unbounded'
];

const TEXT_TREATMENTS = [
    'treatment-gradient', 'treatment-outline', 'treatment-glow',
    'treatment-shadow', 'treatment-block', 'treatment-hollow',
    'treatment-clean', 'treatment-duotone'
];

const COLOR_PALETTES = [
    { accent: '#ff6b6b', secondary: '#ffd166', glow: 'rgba(255, 107, 107, 0.4)', background: '#21151d' },
    { accent: '#65e6d9', secondary: '#a78bfa', glow: 'rgba(101, 230, 217, 0.38)', background: '#101d25' },
    { accent: '#f9a8d4', secondary: '#fef08a', glow: 'rgba(249, 168, 212, 0.4)', background: '#211827' },
    { accent: '#8be28b', secondary: '#7dd3fc', glow: 'rgba(139, 226, 139, 0.38)', background: '#12211d' },
    { accent: '#ff9f43', secondary: '#ff6bcb', glow: 'rgba(255, 159, 67, 0.4)', background: '#241914' },
    { accent: '#f4f1de', secondary: '#e07a5f', glow: 'rgba(244, 241, 222, 0.35)', background: '#211e1b' }
];

function getRandomLayout() {
    return LAYOUT_TYPES[Math.floor(Math.random() * LAYOUT_TYPES.length)];
}

function getRandomFont() {
    return FONT_TYPES[Math.floor(Math.random() * FONT_TYPES.length)];
}

function getRandomTreatment() {
    return TEXT_TREATMENTS[Math.floor(Math.random() * TEXT_TREATMENTS.length)];
}

function getRandomPalette() {
    return COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
}