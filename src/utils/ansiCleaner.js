export const cleanAnsiCodes = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\\u001b\\[[0-9;]*[mGKHJA]/g, '')
    .replace(/\\033\\[[0-9;]*[mGKHJA]/g, '')
    .replace(/\\[[0-9;]*[mGKHJA]/g, '')
    .replace(/\\[38;[0-9;]+m/g, '')
    .replace(/\\[4;[0-9]+m/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
};

export const parseProgressLog = (text) => {
  const cleaned = cleanAnsiCodes(text);
  
  const percentMatch = cleaned.match(/(\d+)%/);
  const percent = percentMatch ? parseInt(percentMatch[1]) : null;
  
  const completeMatch = cleaned.match(/(\d+)\/(\d+)\s+complete/);
  const completed = completeMatch ? parseInt(completeMatch[1]) : null;
  const total = completeMatch ? parseInt(completeMatch[2]) : null;
  
  const trackMatch = cleaned.match(/Processing\s+(.+?)(?:\s+\d+%|$)/);
  const trackName = trackMatch ? trackMatch[1].trim() : null;
  
  return {
    cleaned,
    percent,
    completed,
    total,
    trackName
  };
};
