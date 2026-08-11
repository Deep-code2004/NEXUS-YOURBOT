import HandTrackingProvider from '@/components/HandTrackingProvider';
import Scene from '@/components/Scene';
import HUD from '@/components/HUD';

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background selection:bg-white/10">
      <HandTrackingProvider>
        <HUD />
        <Scene />
      </HandTrackingProvider>
    </main>
  );
}
