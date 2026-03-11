export function getEventDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startTotal = startHour * 60 + (startMin || 0);
  const endTotal = endHour * 60 + (endMin || 0);
  return endTotal - startTotal;
}
