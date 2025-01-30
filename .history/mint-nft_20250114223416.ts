import { getKeypairFromFile } from "@solana-developers/helpers";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { Umi, Context, KeypairSigner, metaplex } from "@metaplex-foundation/umi";

// Connect to Solana
const connection = new Connection(clusterApiUrl("devnet"));

// Load payer keypair
const payer = await getKeypairFromFile("~/.config/solana/id.json");
console.log("payer", payer.publicKey.toBase58());

// Create a new mint for the NFT
const mint = Keypair.generate();
console.log("mint", mint.publicKey.toBase58());

// Initialize UMI context
const context: Context = {
    connection,
    payer: payer as KeypairSigner,
    cluster: "devnet",  // Set to "mainnet" or "testnet" as needed
};

// Initialize Metaplex (UMI-specific interface)
const metaplexInstance = metaplex(context);

// Define the metadata for the NFT
const metadata = {
    name: "Student NFT",
    symbol: "BRUNEL",
    uri: "https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json",
};

// Create the NFT
const { nft } = await metaplexInstance.createNft({
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
