import { RoomScreen } from '@/features/room/RoomScreen';

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomScreen roomId={id} />;
}
