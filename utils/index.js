import { fileTypeFromBuffer } from "file-type";
/**
 * Validates if a file's content matches its extension.
 * @param {string} filePath - Path to the file
 * @param {string[]} validExtensions - List of valid extensions
 * @returns {Promise<boolean>} - True if valid, otherwise false
 */
export const validateFiles = async (
  { fileType ,file},
  validExtensions
) => {
    try {
    const ext = fileType;
    if (!validExtensions.includes(ext)) {
      return false;
    }
    const type = await fileTypeFromBuffer(file?.buffer);
    if (type && (type.ext === ext || type.mime?.includes(ext))) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};
