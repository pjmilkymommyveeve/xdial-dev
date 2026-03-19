export const convertToNYTime = (timestamp) => {
  if (!timestamp) return timestamp;
  
  try {
    // If it's a number (Unix timestamp)
    if (typeof timestamp === 'number') {
      // Convert seconds to milliseconds if necessary
      const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      return new Date(ms).toLocaleString("en-US", { 
        timeZone: "America/New_York",
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
      if (isNaN(timestamp.getTime())) return null;
      return timestamp.toLocaleString("en-US", { 
        timeZone: "America/New_York",
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }

    // For string timestamps sent from backend
    let dateStr = timestamp;
    if (typeof dateStr === 'string') {
      // If it's a format like "YYYY-MM-DD HH:mm:ss" without timezone, treat as UTC
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateStr)) {
        dateStr = dateStr.replace(' ', 'T') + 'Z';
      }
    }

    const date = new Date(dateStr);
    
    // Fallback to original string if invalid date
    if (isNaN(date.getTime())) return timestamp; 

    return date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  } catch (e) {
    console.error("Error converting timezone:", e);
    return timestamp;
  }
};

export const convertToNYDateOnly = (timestamp) => {
  if (!timestamp) return timestamp;
  try {
    let dateStr = timestamp;
    if (typeof dateStr === 'string') {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateStr)) {
        dateStr = dateStr.replace(' ', 'T') + 'Z';
      }
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return timestamp; 
    return date.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      year: 'numeric', month: 'numeric', day: 'numeric'
    });
  } catch (e) {
    return timestamp;
  }
};
