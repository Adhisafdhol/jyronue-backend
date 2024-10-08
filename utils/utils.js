crypto = require("node:crypto");
path = require("node:path");

exports.convertFileName = (file) => {
  const uuid = crypto.randomUUID();
  const ext = path.extname(file.originalname);
  const newName = "image-" + uuid + ext;

  return { ...file, originalname: newName };
};
