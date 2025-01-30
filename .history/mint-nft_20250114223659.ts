import { getKeypairFromFile } from "@solana-developers/helpers";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { Umi, Context, KeypairSigner } from "@metaplex-foundation/umi";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";

// Connect to Solana
const connection = new Connection(clusterApiUrl("devnet"));

// Load payer keypair
const payer = await getKeypairFromFile("~/.config/solana/id.json");
console.log("payer", payer.publicKey.toBase58());

// Create a new mint for the NFT
const mint = Keypair.generate();
console.log("mint", mint.publicKey.toBase58());

// Initialize UMI context
const context = new Context({
  connection,
  payer: payer,  // Payer's keypair
  cluster: "devnet",  // Set to "mainnet" or "testnet" as needed
});

// Create the NFT (using `createNft` function from the Metaplex package)
const metadata = {
  name: "Student NFT",
  symbol: "BRUNEL",
  uri: "https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json",
};

const { nft } = await createNft(context, {
  uri: metadata.uri,
  name: metadata.name,
  symbol: metadata.symbol,
  sellerFeeBasisPoints: 500,  // 5% fee on secondary sales
  isMutable: true,
  creators: null,  // Set to appropriate creators if needed
  mint: mint.publicKey,
});

// Print out the created NFT metadata
console.log("NFT Minted: ", nft);
console.log("NFT Metadata URI: ", nft.uri);
