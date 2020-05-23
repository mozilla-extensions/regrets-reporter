export const triggerClientDownloadOfData = async (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  let file = new File([json], filename, {
    type: "application/json;charset=utf-8",
  });
  return {
    url: URL.createObjectURL(file),
    filename,
  };
};
