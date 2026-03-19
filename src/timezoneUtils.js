import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a backend timestamp (assumed UTC) to America/New_York time.
 * @param {string|number|Date} timestamp - The timestamp from the backend
 * @returns {string} Formatted NY time, e.g. "03/24/2024, 08:00:00 AM"
 */
export const convertToNYTime = (timestamp) => {
  if (!timestamp) return "-";
  
  try {
    // Parse as UTC. If no timezone offset is provided, dayjs defaults it to UTC.
    // If an offset is provided (e.g., Z or +05:00), it correctly adjusts to UTC.
    const d = dayjs.utc(timestamp);
    
    if (!d.isValid()) return timestamp;

    return d.tz("America/New_York").format("MM/DD/YYYY, hh:mm:ss A");
  } catch (error) {
    console.error("Error converting timezone:", error, timestamp);
    return timestamp;
  }
};

/**
 * Converts a backend timestamp to America/New_York date only.
 * @param {string|number|Date} timestamp - The timestamp from the backend
 * @returns {string} Formatted NY date, e.g. "03/24/2024"
 */
export const convertToNYDateOnly = (timestamp) => {
  if (!timestamp) return "-";
  
  try {
    const d = dayjs.utc(timestamp);
    
    if (!d.isValid()) return timestamp;

    return d.tz("America/New_York").format("MM/DD/YYYY");
  } catch (error) {
    return timestamp;
  }
};
