import express from "express";
import multer from "multer";
import { allowedMimeTypes } from "./constants/index.js";
import { validateFiles } from "./utils/index.js";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const whiteListURLS = [
  "http://localhost:5173",
  "http://app.dev.defhawk.com.s3-website.ap-south-1.amazonaws.com",
  "https://defhawk.com",
  "https://app.defhawk.com",
];

const corsOpts = {
  credentials: true,
  methods: "GET,PUT,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  origin: function (origin, callback) {
    if (whiteListURLS.indexOf(origin || "") !== -1 || origin === undefined) {
      callback(null, true);
    } else {
      callback(new Error("Unauthorized Domain"), false);
    }
  },
};

app.use(cors(corsOpts)); // Apply CORS middleware
app.options("*", cors(corsOpts));

app.post("/upload-avatar", upload.single("file"), async (req, res) => {
  try {
  
    const { file } = req;
    const { folder, fileName, fileType } = req.body;
    // Validate the file MIME type
    const isValid = await validateFiles({ file, fileType }, allowedMimeTypes);

    if (!isValid) {
      return res.status(400).send({error:"Invalid file type",data});
    }

    // Step 1: Get the presigned URL from your API (replace the URL with your actual API endpoint)
    const presignedUrlResponse = await axios.post(
      `${process.env.BASE_URL}/s3/image/presigned-url`,
      {
        fileName,
        fileType,
        folder, // Define the folder where you want to store the file in cloud
      },
      {
        headers: { authorization: req.headers?.authorization },
      }
    );
    const presignedUrl = presignedUrlResponse.data.data;

    // Step 2: Upload the file to the cloud using the presigned URL
    const uploadResponse = await axios.put(presignedUrl, file.buffer, {
      headers: {
        "Content-Type": file.mimetype, // Set the correct MIME type
      },
    });
    if (uploadResponse.status === 200) {
      res.status(200).send({ data: presignedUrl?.split("?")[0], error: null });
    } else {
      res.status(400).send({ data: null, error: "Error uploading file" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({
        data: null,
        error: error.response?.data?.error || error.response?.data?.message,
      });
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
