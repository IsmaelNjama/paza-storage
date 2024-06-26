require("dotenv").config();

const express = require("express");

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 2500;

// app.use(express.static("uploads"));
app.use(cors({ origin: "*" }));

const bucketName = process.env.BUCKET_NAME;
const accessKeyId = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const region = process.env.BUCKET_REGION;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: region,
});

// Handle file upload endpoint
app.post("/uploads", upload.single("brand-avatar"), async (req, res, next) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);

    await s3.send(command);

    const avatarUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${req.file.originalname}`;

    res.send({ avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading file");
  }
});

app.listen(PORT, () => console.log("listening on port... " + PORT));
