const express = require("express");
const secp = require("@noble/secp256k1");
const app = express();
const cors = require("cors");
const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {
  1: 100,
  2: 50,
  3: 75,
};

privateKeys = {};
privateKeysUint = {};

for (let address in balances) {
  privateKey = secp.utils.randomPrivateKey();
  publicKey = secp.getPublicKey(privateKey);
  balances[secp.utils.bytesToHex(publicKey)] = balances[address];
  privateKeys[secp.utils.bytesToHex(publicKey)] =
    secp.utils.bytesToHex(privateKey);
  privateKeysUint[secp.utils.bytesToHex(publicKey)] = privateKey;
  delete balances[address];
}

let messageHash = "";

// creates the digital signature taking in private key from the user, message hash is pre filled
const createDigitalSignature = async (privateKey) => {
  messageHash = await secp.utils.sha256("i am the owner of this address");
  const digitalSignature = await secp.sign(messageHash, privateKey);
  return digitalSignature;
};

// verifies if digital signature is valid taking in digital signature and sender address
const verifyDigitalSignature = async (digitalSignature, sender) => {
  messageHash = await secp.utils.sha256("i am the owner of this address");
  secp.verify(digitalSignature, messageHash, sender);
};

console.log("public key => balance");
console.log(balances);
console.log("public key => private key");
console.log(privateKeys);

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount } = req.body;

  // sign with digital signature using sender private key before calling /send
  const isValid = verifyDigitalSignature(
    createDigitalSignature(privateKeysUint[sender]),
    sender
  );

  console.log(recipient);

  // checks if digital signature is valid
  if (isValid && `${recipient}` in balances) {
    try {
      balances[sender] -= amount;
      balances[recipient] = (balances[recipient] || 0) + +amount;
      res.send({ balance: balances[sender] });
    } catch (e) {
      console.log(e, "unable to verify signature");
    }
  } else {
    alert("unable to verify signature");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
