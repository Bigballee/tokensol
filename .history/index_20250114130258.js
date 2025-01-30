//import express from "express";
import bodyParser from "body-parser";
import { Keypair, Transaction, SystemProgram, Connection, clusterApiUrl } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeInstruction,
} from "@solana/spl-token";
import { pack } from "@solana/spl-token-metadata";

const app = express();
const port = 3000;

app.use(bodyParser.json());

const connection = new Connection(clusterApiUrl("devnet"));
const payer = await getKeypairFromFile("~/.config/solana/id.json");

app.post("/api/mint-nft", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Step 1: Generate mint
    const mint = Keypair.generate();

    // Step 2: Metadata for the NFT
    const metadata = {
      mint: mint.publicKey,
      name: "Student Nft",
      symbol: "BRUNEL",
      uri: "https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json",
    };

    // Step 3: Calculate required space
    const mintSpace = getMintLen([]);
    const metadataSpace = pack(metadata).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace + metadataSpace);

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
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    );

    // Step 6: Mint token to recipient wallet
    const mintToIx = createMintToInstruction(
      mint.publicKey,
      walletAddress, // Recipient wallet
      payer.publicKey, // Mint authority
      1 // Amount of NFT (1 for single NFT)
    );

    // Step 7: Initialize metadata
    const initializeMetadataIx = createInitializeInstruction({
      mint: mint.publicKey,
      metadata: mint.publicKey,
      mintAuthority: payer.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      programId: TOKEN_2022_PROGRAM_ID,
      updateAuthority: payer.publicKey,
    });

    // Step 8: Combine instructions into a transaction
    const transaction = new Transaction().add(
      createAccountIx,
      initializeMintIx,
      initializeMetadataIx,
      mintToIx
    );

    // Sign and send the transaction
    const signature = await connection.sendTransaction(transaction, [payer, mint]);
    res.status(200).json({ signature });
  } catch (error) {
    console.error("Error minting NFT:", error);
    res.status(500).json({ error: "Failed to mint NFT" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

