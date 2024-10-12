const crypto = require("node:crypto");
const path = require("node:path");

exports.convertFileName = (file) => {
  const uuid = crypto.randomUUID();
  const ext = path.extname(file.originalname);
  const newName = "image-" + uuid + ext;

  return { ...file, originalname: newName };
};

exports.isUUID = (value) => {
  const regex = new RegExp(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    "i"
  );

  return regex.test(value);
};
