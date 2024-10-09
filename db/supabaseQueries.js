const supabase = require("../config/supabaseConfig");
const { decode } = require("base64-arraybuffer");

exports.uploadFile = async ({ user, file, from }) => {
  // Upload file using standard upload
  const fileBase64 = decode(file.buffer.toString("base64"));
  const folder = user.id;

  const { data, error } = await supabase.storage
    .from(from)
    .upload(`${folder}/${file.originalname}`, fileBase64, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new Error("Failed to upload file");
  } else {
    return data;
  }
};

exports.getPublicUrl = ({ user, file, from }) => {
  const folder = user.id;
  const { data, error } = supabase.storage
    .from(from)
    .getPublicUrl(`${folder}/${file.originalname}`);

  if (error) {
    throw new Error("Failed to get public url");
  } else {
    return data;
  }
};
