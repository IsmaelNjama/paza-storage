require("dotenv").config();

const express = require("express");

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const cors = require("cors");
const multer = require("multer");
const allowedMimeTypes = require("./mimeTypes/allowedMimeTypes");

const app = express();
const PORT = process.env.PORT || 2500;

// app.use(express.static("uploads"));
app.use(cors({ origin: "*" }));

const bucketName = process.env.BUCKET_NAME;
const accessKeyId = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const region = process.env.BUCKET_REGION;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: region,
});

// Helper function to upload file to s3
const uploadFileToS3 = async (file, folder) => {
  const params = {
    Bucket: bucketName,
    Key: `${folder}/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);

  await s3.send(command);
  return `https://${bucketName}.s3.${region}.amazonaws.com/${folder}/${file.originalname}`;
};

// avatar route
app.post("/uploads/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    const avatarUrl = await uploadFileToS3(req.file, "avatars");
    res.send({ avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading avatar");
  }
});

// multiple photos route

app.post(
  "/uploads/photos",
  upload.array("photos", 10),
  async (req, res, next) => {
    try {
      const photoUrls = await Promise.all(
        req.files.map(async (file) => {
          const photoUrl = await uploadFileToS3(file, "photos");
          return photoUrl;
        })
      );
      res.send({ photoUrls });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error uploading photos");
    }
  }
);

// Multiple files of different formats
app.post(
  "/uploads/attachments",
  upload.array("attachments", 10),
  async (req, res, next) => {
    try {
      const attachmentUrls = await Promise.all(
        req.files.map(async (file) => {
          const attachmentUrl = await uploadFileToS3(file, "attachments");
          return attachmentUrl;
        })
      );
      res.send({ attachmentUrls });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error uploading attachments");
    }
  }
);

app.listen(PORT, () => console.log("listening on port... " + PORT));
