// ed25519 is a widely used elliptic curve for digital signatures
// what it provides is not true ZK proof, but a simple signature proof
import { ed25519 } from "@noble/curves/ed25519.js";
// hexToBytes for converting hex to bytes
// bytesToHex for converting bytes to hex
import { bytesToHex, hexToBytes} from "@noble/hashes/utils.js";

// Simple ZK-like Signature Proof
export interface ZkProof {
  pubKey: string;         // public key (hex)
  messageHash: string;    // fieldHash (SHA256 of user data)
  signature: string;      // Ed25519 signature
}

// Generates a signing keypair (the provider keypair)
export function generateKeypair() {
  const priv = ed25519.utils.randomSecretKey();
  const pub = ed25519.getPublicKey(priv);
  return {
    privKey: bytesToHex(priv),
    pubKey: bytesToHex(pub),
  };
}

//Create a proof that the provider signs a message hash
export function createProof(privKeyHex: string, messageHash: string): ZkProof {
  const priv = hexToBytes(privKeyHex);
  const msgBytes = hexToBytes(messageHash);
  const signature = ed25519.sign(msgBytes, priv);
  const pub = ed25519.getPublicKey(priv);
  return {
    pubKey: bytesToHex(pub),
    messageHash,
    signature: bytesToHex(signature),
  };
}

//Verify proof using only public info (pubKey, messageHash, signature)
export function verifyProof(proof: ZkProof): boolean {
  try {
    return ed25519.verify(hexToBytes(proof.signature), hexToBytes(proof.messageHash), hexToBytes(proof.pubKey));
  } catch {
    return false;
  }
}
