// Claude oftens returns NOT clean JSON. This is a way to try to clean it. 

export const cleanJSON = (str: string) => {
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error('No valid JSON object found in string');
  }
  
  return str.slice(start, end + 1);
}
