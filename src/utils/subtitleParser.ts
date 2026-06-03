import { SubtitleCue } from '../types';

/**
 * Parses raw SRT subtitle content into structured SubtitleCues.
 * Extremely robust to ensure compatibility with standard media formats,
 * handling double carriage returns, various time notations, decimals, and commas.
 */
export function parseSRT(srtText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  if (!srtText || !srtText.trim()) return cues;

  const cleanText = srtText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sections = cleanText.split(/\n\s*\n+/);
  
  let index = 1;
  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      let timeLine = lines[0];
      let textStartIdx = 1;
      
      // If first line is a numeric sequence index, use the next line for times
      if (/^\d+$/.test(lines[0])) {
        timeLine = lines[1];
        textStartIdx = 2;
      }
      
      if (timeLine && timeLine.includes('-->')) {
        const parts = timeLine.split('-->').map(p => p.trim());
        
        const parseTimeStr = (tStr: string): number => {
          const mainParts = tStr.split(':');
          if (mainParts.length >= 2) {
            const secsPart = mainParts[mainParts.length - 1];
            const mins = Number(mainParts[mainParts.length - 2]);
            const hrs = mainParts.length === 3 ? Number(mainParts[0]) : 0;
            
            // Handles both comma milliseconds (SRT standard) and dot milliseconds
            const secs = Number(secsPart.replace(',', '.'));
            return (hrs * 3600) + (mins * 60) + secs;
          }
          return 0;
        };
        
        const startTime = parseTimeStr(parts[0]);
        const endTime = parseTimeStr(parts[1]);
        const text = lines.slice(textStartIdx).join('\n');
        
        if (!isNaN(startTime) && !isNaN(endTime)) {
          cues.push({
            id: `c-${index++}-${Date.now()}`,
            startTime,
            endTime,
            text
          });
        }
      }
    }
  }
  return cues;
}

/**
 * Reconstructs standard SRT copy-paste string from raw SubtitleCue list.
 */
export function cuesToSRT(cues: SubtitleCue[]): string {
  if (!cues || cues.length === 0) return '';
  
  const formatTime = (secs: number): string => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    const wholeSecs = Math.floor(remainingSecs);
    const ms = Math.floor((remainingSecs - wholeSecs) * 1000);
    
    const pad = (num: number, n = 2) => String(num).padStart(n, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(wholeSecs)},${pad(ms, 3)}`;
  };

  return cues.map((cue, idx) => {
    return `${idx + 1}\n${formatTime(cue.startTime)} --> ${formatTime(cue.endTime)}\n${cue.text}`;
  }).join('\n\n');
}
