import express from "express";
import bodyParser from "body-parser";
import {
  Keypair,
  Transaction,
  SystemProgram,
  Connection,
  clusterApiUrl,
  PublicKey,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
const port = 3000;

app.use(bodyParser.json());

// Helper function to load keypair from file
async function getKeypairFromFile(filePath) {
  const keypairFilePath = path.resolve(
    filePath.replace("~", process.env.HOME || process.env.USERPROFILE)
  );
  const keypairData = JSON.parse(fs.readFileSync(keypairFilePath));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

async function startServer() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const payer = await getKeypairFromFile("~/.config/solana/id.json");

  app.post("/mint-nft", async (req, res) => {
    try {
      const { solanaAddress } = req.body;

      // Validate the Solana address
      if (!solanaAddress) {
        return res.status(400).json({ error: "Solana wallet address is required" });
      }

      const recipientPublicKey = new PublicKey(solanaAddress);

      // Step 1: Generate mint
      const mint = Keypair.generate();

      // Step 2: Metadata for the NFT
      const metadata = {
        mint: mint.publicKey,
        name: "Student NFT",
        symbol: "BRUNEL",
        uri: "https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json",
      };

      // Step 3: Calculate required space and lamports for rent exemption
      const mintSpace = 82; // Space required for mint account (standard)
      const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

      // Step 4: Create mint account
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintSpace,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // Step 5: Initialize mint
      const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        0, // NFTs have 0 decimals
        payer.publicKey, // Mint authority
        null, // Freeze authority can be null for NFTs
        TOKEN_2022_PROGRAM_ID
      );

      // Step 6: Ensure recipient has an associated token account
      const associatedTokenAccount = await PublicKey.findProgramAddress(
        [
          recipientPublicKey.toBuffer(),
          TOKEN_2022_PROGRAM_ID.toBuffer(),
          mint.publicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if the associated token account exists
      const associatedTokenAccountInfo = await connection.getAccountInfo(associatedTokenAccount[0]);

      let createAssociatedAccountIx;
      if (!associatedTokenAccountInfo) {
        // If the associated token account doesn't exist, create it
        createAssociatedAccountIx = createAssociatedTokenAccountInstruction(
          payer.publicKey, // Payer's public key
          associatedTokenAccount[0], // The associated token account for the recipient
          recipientPublicKey, // The recipient's public key
          mint.publicKey // The mint of the NFT
        );
      }

      // Step 7: Mint token to recipient's associated token account
      const mintToIx = createMintToInstruction(
        mint.publicKey,
        associatedTokenAccount[0], // Recipient's associated token account
        payer.publicKey, // Mint authority
        1 // Amount of NFT (1 for a single NFT)
      );

      // Step 8: Combine instructions into a transaction
      const transaction = new Transaction().add(
        createAccountIx,
        initializeMintIx,
        createAssociatedAccountIx ? createAssociatedAccountIx : undefined, // Add the create account instruction if needed
        mintToIx
      );

      // Step 9: Sign and send the transaction
      const signature = await connection.sendTransaction(transaction, [payer, mint]);

      console.log("Transaction signature:", signature);
      res.status(200).json({ signature });
    } catch (error) {
      console.error("Error minting NFT:", error);
      res.status(500).json({ error: "Failed to mint NFT" });
    }
  });

  // Test route
  app.get("/test", (req, res) => {
    res.send("Server is running!");
  });

  // Start server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Run the async function to start the server
startServer().catch((error) => {
  console.error("Error starting server:", error);
});
