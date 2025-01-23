/**
 * @param time is expected in MS
 */
const formatTime = (time: number) => {
  const s = Math.floor(time / 1000);

  const formattedSeconds = s.toString().padStart(2, "0");

  return `${formattedSeconds}”`;
};

export { formatTime };
