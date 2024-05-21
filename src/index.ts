import express from "express";
import { S3 } from "aws-sdk";
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

require('dotenv').config();


const s3 = new S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    endpoint: "https://f176de080d946997a747a188e04f44bc.r2.cloudflarestorage.com",
    
})

const app = express();

// Middleware to handle CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path;
    console.log("Requested path:", filePath);
    console.log("ID:", id);

    try {
        const key = `dist/${id}${filePath}`;
        console.log("S3 key:", key);

        const contents = await s3.getObject({
            Bucket: "vercel1",
            Key: key
        }).promise();

        let contentType = '';
        if (filePath.endsWith('.html')) {
            contentType = 'text/html';
        } else if (filePath.endsWith('.css')) {
            contentType = 'text/css';
        } else if (filePath.endsWith('.js')) {
            contentType = 'application/javascript';
        } else if (filePath.endsWith('.png')) {
            contentType = 'image/png';
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            contentType = 'image/jpeg';
        } else if (filePath.endsWith('.gif')) {
            contentType = 'image/gif';
        } else if (filePath.endsWith('.svg')) {
            contentType = 'image/svg+xml';
        } else if (filePath.endsWith('.ico')) {
            contentType = 'image/x-icon';
        } else {
            contentType = 'application/octet-stream';
        }

        console.log("Setting Content-Type:", contentType);
        res.set("Content-Type", contentType);

        // Set Cache-Control headers to avoid caching issues
        res.set("Cache-Control", "no-store");

        // Log the response details
        //console.log("Responding with contents, length:", contents.Body.length);
        console.log( contents.Body );
        res.send(contents.Body);
    } catch (error) {
        console.error("Error occurred:", error);
        //@ts-ignore
        if (error.code === "NoSuchKey") {
            res.status(404).send("File not found");
        } else {
            res.status(500).send("Internal Server Error");
        }
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
