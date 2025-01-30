const express = require("express");
const bodyParser = require("body-parser");
const {
  Keypair,
  Transaction,
  SystemProgram,
  Connection,
  clusterApiUrl,
  PublicKey,
} = require("@solana/web3.js");
const {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
} = require("@solana/spl-token");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

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

  app.post("/api/mint-nft", async (req, res) => {
    try {
      const { solanaAddress } = req.body;

      // Validate the Solana address
      if (!solanaAddress) {
        return res.status(400).json({ error: "Solana wallet address is required" });
      }

      const recipientPublicKey = new PublicKey(solanaAddress);

      // Step 1: Generate mint
      const mint = Keypair.generate();

      // Step 2: Calculate required space and lamports for rent exemption
      const mintSpace = getMintLen([]); // Empty extensions for a standard mint account
      const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

      // Step 3: Create mint account
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintSpace,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // Step 4: Initialize mint
      const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        0, // NFTs have 0 decimals
        payer.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      );

      // Step 5: Create Associated Token Account for Recipient
      const recipientTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        recipientPublicKey
      );

      // Fix: Ensure correct program ID is used for associated token account creation
      const createRecipientAccountIx = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        recipientTokenAccount,
        recipientPublicKey,
        mint.publicKey, // The mint for the token
        TOKEN_PROGRAM_ID // Correct program ID for the associated token account
      );

      // Step 6: Mint token to recipient wallet
      const mintToIx = createMintToInstruction(
        mint.publicKey,
        recipientTokenAccount, // Recipient's associated token account
        payer.publicKey, // Mint authority
        1 // Amount of NFT (1 for single NFT)
      );

      // Step 7: Combine instructions into a transaction
      const transaction = new Transaction().add(
        createAccountIx,
        initializeMintIx,
        createRecipientAccountIx,
        mintToIx
      );

      // Step 8: Sign and send the transaction
      const signature = await connection.sendTransaction(transaction, [payer, mint]);

      console.log("Transaction signature:", signature);
      res.status(200).json({ signature });
    } catch (error) {
      console.error("Error minting NFT:", error);
      res.status(500).json({ error: "Failed to mint NFT" });
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Run the async function to start the server
startServer().catch((error) => {
  console.error("Error starting server:", error);
});
