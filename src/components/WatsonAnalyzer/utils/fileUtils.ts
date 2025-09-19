
// Download utilities
export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const encodedUri = encodeURI(content);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getCurrentDateString = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const getTimestampString = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5).replace(':', '-'); // HH-MM
  return `${date}_${time}`;
};

export const generateFileName = (
  operation: 'optimized' | 'analysis',
  useCase: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next',
  extension: 'xlsx' | 'json' | 'csv' | 'txt'
): string => {
  const timestamp = getTimestampString();
  return `${operation}_${useCase}_${timestamp}.${extension}`;
};