/**
 * @param time is expected in MS
 */
const formatTime = (time: number) => {
  const s = Math.floor(time / 1000);
  const ms = (time / 1000) % 1;

  const formattedSeconds = s.toString().padStart(2, "0");
  const formattedMilliseconds = ms.toFixed(2).substring(2);

  return `${formattedSeconds}"${formattedMilliseconds}`;
};

export { formatTime };
