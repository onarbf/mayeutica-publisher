
export async function thisDateIsOlderThanToday(timestamp: Date) :Promise<boolean>{ //this functions check for each topic if is older than today. In case true, we don't add it to our database
    const actualDate = new Date();
    const today = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate());
    const dateTimestamp = new Date(timestamp);
  
      return dateTimestamp < today;
  }
