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
    console.log("Loading keypair from file:", filePath);
  const keypairFilePath = path.resolve(
    filePath.replace("~", process.env.HOME || process.env.USERPROFILE)
  );
  const keypairData = JSON.parse(fs.readFileSync(keypairFilePath));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  console.log("Loaded keypair:", keypair.publicKey.toBase58());
  return keypair;
}

async function startServer() {
    console.log("starting server...");
  const connection = new Connection(clusterApiUrl("devnet"));
  console.log("Connected to Devnet cluster");
  const payer = await getKeypairFromFile("~/.config/solana/id.json");

  app.post("/mint-nft", async (req, res) => {
    try {
      const { solanaAddress } = req.body;
        console.log("Recieved request to mint NFT for address:", solanaAddress);
      // Validate the Solana address
      if (!solanaAddress) {
        console.log("Error: No Solana address provided");
        return res.status(400).json({ error: "Solana wallet address is required" });
      }

      const recipientPublicKey = new PublicKey(solanaAddress);
      console.log("Recipient public key:", recipientPublicKey.toBase58());
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
      console.log("Calculated lamports for mint rent exemption:", lamports);

      // Step 4: Create mint account
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintSpace,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      });
      console.log("Created mint account instruction");

      // Step 5: Initialize mint
      const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        0, // NFTs have 0 decimals
        payer.publicKey, // Mint authority
        null, // Freeze authority can be null for NFTs
        TOKEN_2022_PROGRAM_ID
      );
      console.log("Created initialize mint instruction");

      // Step 6: Ensure recipient has an associated token account
      console.log("Checking if recipient has an associated token account...");
      const associatedTokenAccount = await PublicKey.findProgramAddress(
        [
          recipientPublicKey.toBuffer(),
          TOKEN_2022_PROGRAM_ID.toBuffer(),
          mint.publicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log("Associated token account address:", associatedTokenAccount[0].toBase58());

      // Check if the associated token account exists
      const associatedTokenAccountInfo = await connection.getAccountInfo(associatedTokenAccount[0]);

      let createAssociatedAccountIx;
      if (!associatedTokenAccountInfo) {
        console.log("Associated token account does not exist. Creating it...");
        // If the associated token account doesn't exist, create it
        createAssociatedAccountIx = createAssociatedTokenAccountInstruction(
          payer.publicKey, // Payer's public key
          associatedTokenAccount[0], // The associated token account for the recipient
          recipientPublicKey, // The recipient's public key
          mint.publicKey // The mint of the NFT
        );
        console.log("Created associated token account creation instruction");
      }
      

      // Step 7: Mint token to recipient's associated token account
      console.log("Creating mint instruction...");
      const mintToIx = createMintToInstruction(
        mint.publicKey,
        associatedTokenAccount[0], // Recipient's associated token account
        payer.publicKey, // Mint authority
        1 // Amount of NFT (1 for a single NFT)
      );
      console.log("Created mint to instruction");

      // Step 8: Combine instructions into a transaction
      const transaction = new Transaction().add(
        createAccountIx,
        initializeMintIx,
        createAssociatedAccountIx ? createAssociatedAccountIx : undefined, // Add the create account instruction if needed
        mintToIx
      );
      console.log("Combined instructions into transaction");


      // Step 9: Sign and send the transaction
      const signature = await connection.sendTransaction(transaction, [payer, mint]);
      console.log("Signing and sending transaction...");

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
