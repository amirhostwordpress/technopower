const ftp = require("basic-ftp");
const path = require("path");

const client = new ftp.Client();

client.ftp.verbose = true;

async function uploadAssets() {
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
      port: Number(process.env.FTP_PORT || 21),
    });

    console.log("FTP connected");

    const localAssets = path.resolve(
      __dirname,
      "../../tech-power-nextjs-frontend/public/assets"
    );

    const remoteAssets = process.env.FTP_ASSETS_PATH || "/public_html/assets";

    console.log("Uploading:");
    console.log(localAssets);

    console.log("To:");
    console.log(remoteAssets);

    await client.ensureDir(remoteAssets);
    await client.clearWorkingDir();

    await client.uploadFromDir(localAssets, remoteAssets);

    console.log("✓ Frontend assets uploaded successfully");
  } catch (error) {
    console.error("FTP upload failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

uploadAssets();