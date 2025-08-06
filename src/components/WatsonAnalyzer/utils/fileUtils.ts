
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
