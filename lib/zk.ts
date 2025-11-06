import { Field, Poseidon, ZkProgram } from "o1js";

export interface ZkProof {
  proof: string;
  publicOutput: string;
  verificationKey: string;
}

function stringToField(str: string): Field {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Field.from(bytes.reduce((acc, byte, i) => acc + BigInt(byte) * (256n ** BigInt(i)), 0n));
}

const KYCProgram = ZkProgram({
  name: "KYCProof",
  publicInput: Field,
  methods: {
    prove: {
      privateInputs: [Field, Field, Field],
      async method(publicInput: Field, fullName: Field, dob: Field, idNumber: Field): Promise<void> {
        const computedHash = Poseidon.hash([fullName, dob, idNumber]);
        computedHash.assertEquals(publicInput);
      },
    },
  },
});

class KYCProof extends ZkProgram.Proof(KYCProgram) {}

let compiledProgram: { verificationKey: any } | null = null;

export async function compileProgram(): Promise<{ verificationKey: any }> {
  if (compiledProgram) {
    return compiledProgram;
  }
  
  console.log("Compiling KYC ZK program... (this may take a while)");
  const { verificationKey } = await KYCProgram.compile();
  compiledProgram = { verificationKey };
  console.log("Compilation complete!");
  
  return compiledProgram;
}

export async function createProof(
  fullName: string,
  dob: string,
  idNumber: string
): Promise<ZkProof> {
  if (!fullName || !dob || !idNumber) {
    throw new Error("Missing required fields: fullName, dob, and idNumber are required");
  }

  const fullNameField = stringToField(fullName.toUpperCase());
  const dobField = stringToField(dob);
  const idNumberField = stringToField(idNumber.toUpperCase());

  const expectedHash = Poseidon.hash([fullNameField, dobField, idNumberField]);

  const { verificationKey } = await compileProgram();

  const { proof } = await KYCProgram.prove(
    expectedHash,
    fullNameField,
    dobField,
    idNumberField
  );

  const proofJson = proof.toJSON();
  return {
    proof: JSON.stringify(proofJson),
    publicOutput: expectedHash.toString(),
    verificationKey: JSON.stringify(verificationKey),
  };
}

export async function verifyProof(proof: ZkProof): Promise<boolean> {
  try {
    await compileProgram();
    
    const proofJson = JSON.parse(proof.proof);
    const proofObj = await KYCProof.fromJSON(proofJson);

    const isValid = await KYCProgram.verify(proofObj);

    return isValid;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

export function calculateExpectedHash(
  fullName: string,
  dob: string,
  idNumber: string
): string {
  const fullNameField = stringToField(fullName.toUpperCase());
  const dobField = stringToField(dob);
  const idNumberField = stringToField(idNumber.toUpperCase());
  
  const hash = Poseidon.hash([fullNameField, dobField, idNumberField]);
  return hash.toString();
}
