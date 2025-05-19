
// Voraussetzungen: Unlock Protocol + CryptoJS im HTML eingebunden
// Unlock Config
const lockAddress = '0x20e8640f1b32bee9496f71ccfe74977d01ae52c1';
const chain = 'polygon';
const tokenId = '1';

// Arweave-Links
const keyUrl = 'https://arweave.net/ajtB17K5rjPUJgUYrVxoBM_S6nC-J20ShVgKbS7EuSA';
const encryptedImages = [
  'https://arweave.net/raFniob1SWyZ2J11OjghzSd3qJXZLjaMhtqm4nhf99k',
  'https://arweave.net/raFniob1SWyZ2J11OjghzSd3qJXZLjaMhtqm4nhf99k',
  'https://arweave.net/raFniob1SWyZ2J11OjghzSd3qJXZLjaMhtqm4nhf99k'
];

// AES-Parameter
const base64Key = 'lMdDv+0GMwQaPFyMmCVbyU0tv7o6aYRR33I8jdg8kWY=';
const base64Iv = 'idJMz0LqEsmwBoExF7hj3w==';

const key = CryptoJS.enc.Base64.parse(base64Key);
const iv = CryptoJS.enc.Base64.parse(base64Iv);

async function checkNFTAccess() {
  if (typeof window.ethereum === 'undefined') {
    alert('Bitte eine Wallet wie MetaMask verbinden.');
    return false;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();

  const nftContract = new ethers.Contract(
    lockAddress,
    ["function ownerOf(uint256 tokenId) view returns (address)"],
    provider
  );

  const owner = await nftContract.ownerOf(tokenId);
  return owner.toLowerCase() === userAddress.toLowerCase();
}

async function decryptAndDisplayImage(index) {
  const hasAccess = await checkNFTAccess();
  if (!hasAccess) {
    alert('Du besitzt nicht das benötigte NFT.');
    return;
  }

  const keyRes = await fetch(keyUrl);
  const keyBuffer = await keyRes.arrayBuffer();
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.lib.WordArray.create(keyBuffer) },
    key,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  const keyJson = JSON.parse(decryptedText);

  const imgRes = await fetch(encryptedImages[index]);
  const imgBuffer = await imgRes.arrayBuffer();

  const decryptedImg = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.lib.WordArray.create(imgBuffer) },
    CryptoJS.enc.Base64.parse(keyJson.key),
    { iv: CryptoJS.enc.Base64.parse(keyJson.iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  const decryptedWords = decryptedImg.words;
  const decryptedBytes = new Uint8Array(decryptedWords.length * 4);
  for (let i = 0; i < decryptedWords.length; i++) {
    const word = decryptedWords[i];
    decryptedBytes.set([
      (word >> 24) & 0xff,
      (word >> 16) & 0xff,
      (word >> 8) & 0xff,
      word & 0xff,
    ], i * 4);
  }

  const blob = new Blob([decryptedBytes], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  document.getElementById(`img${index}`).src = url;
}

// Beispiel: Button ruft decryptAndDisplayImage(0), (1), (2) auf
