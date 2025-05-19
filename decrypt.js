
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDecipheriv } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputDir = path.join(__dirname, 'verschluesselt');
const outputDir = path.join(__dirname, 'entschluesselt');

async function decryptAllFiles() {
  // 🔹 Schlüssel und IV laden
  const keyBase64 = await fs.readFile(path.join(__dirname, 'verschluesselt', 'symmetricKey.txt'), 'utf8');
  const ivBase64 = await fs.readFile(path.join(__dirname, 'verschluesselt', 'iv.txt'), 'utf8');
  const key = Buffer.from(keyBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');

  // 🔹 Input-Dateien laden
  const files = await fs.readdir(inputDir);

  for (const file of files) {
    if (!file.endsWith('.encrypted')) continue;

    const inputPath = path.join(inputDir, file);
    const encryptedData = await fs.readFile(inputPath);

    // 🔹 Entschlüsseln
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    // 🔹 Ursprungsnamen wiederherstellen
    const originalName = file.replace(/\.encrypted$/, '');
    const outputPath = path.join(outputDir, originalName);

    await fs.writeFile(outputPath, decrypted);
    console.log(`✔️ Entschlüsselt: ${file} → ${originalName}`);
  }

  console.log('🎉 Alle Dateien erfolgreich entschlüsselt.');
}

decryptAllFiles().catch(console.error);
