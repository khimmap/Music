'use client';

import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import type { Palette } from '@ember/shared';
import { useQuality } from './quality/QualityProvider';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec3 uA, uB, uC, uD;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv - 0.5 + uMouse;
  float t = uTime;
  float f1 = 0.5 + 0.5 * sin(p.x * 3.0 + t * 0.20);
  float f2 = 0.5 + 0.5 * sin(p.y * 3.0 - t * 0.17 + 1.5);
  float f3 = 0.5 + 0.5 * sin((p.x + p.y) * 2.5 + t * 0.13);
  vec3 col = mix(uA, uB, f1);
  col = mix(col, uC, f2 * 0.6);
  col = mix(col, uD, f3 * 0.5);
  float d = length(uv - 0.5);
  float glow = smoothstep(0.95, 0.08, d);
  col *= mix(0.05, 1.0, glow);
  col = mix(vec3(0.015, 0.012, 0.02), col, 0.92);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Ambient room light: a WebGL mesh gradient (ogl) from the track palette, or a
 * static CSS gradient on low tier / reduced motion. The only ambient light. */
export function AmbientBackground({ palette }: { palette: Palette }) {
  const { flags, reducedMotion, visible } = useQuality();
  const useWebGL = flags.background !== 'css' && !reducedMotion;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (!useWebGL || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const scale = flags.background === 'webgl-half' ? 0.5 : 1;
    const dpr = Math.min(window.devicePixelRatio || 1, flags.dprCap) * scale;
    const renderer = new Renderer({ canvas, dpr, alpha: false, antialias: false });
    const gl = renderer.gl;
    const geometry = new Triangle(gl);

    const init = paletteRef.current;
    const cur = {
      a: hexToRgb(init.vibrant),
      b: hexToRgb(init.dominant),
      c: hexToRgb(init.muted),
      d: hexToRgb(init.dark),
    };
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        uMouse: { value: [0, 0] },
        uA: { value: cur.a },
        uB: { value: cur.b },
        uC: { value: cur.c },
        uD: { value: cur.d },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.03;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.03;
    };
    window.addEventListener('pointermove', onPointer);

    const lerp = (a: number[], b: number[], k: number) => a.map((v, i) => v + ((b[i] ?? v) - v) * k);
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!visibleRef.current) return;
      const target = paletteRef.current;
      const k = Math.min(1, dt / 1.5);
      const u = program.uniforms;
      u.uA.value = lerp(u.uA.value as number[], hexToRgb(target.vibrant), k);
      u.uB.value = lerp(u.uB.value as number[], hexToRgb(target.dominant), k);
      u.uC.value = lerp(u.uC.value as number[], hexToRgb(target.muted), k);
      u.uD.value = lerp(u.uD.value as number[], hexToRgb(target.dark), k);
      const mv = u.uMouse.value as [number, number];
      mv[0] += (mouse.x - mv[0]) * 0.05;
      mv[1] += (mouse.y - mv[1]) * 0.05;
      u.uTime.value = (u.uTime.value as number) + dt;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    };
  }, [useWebGL, flags.background, flags.dprCap]);

  if (!useWebGL) {
    return (
      <div
        aria-hidden="true"
        data-testid="ambient-bg"
        data-mode="css"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(60% 60% at 50% 42%, ${palette.vibrant}55, ${palette.dominant}22 45%, #0a0809 85%)`,
          transition: 'background 1.5s ease',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="ambient-bg"
      data-mode={flags.background}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
