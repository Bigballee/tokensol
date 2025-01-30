import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { Umi,  metaplex } from '@metaplex-foundation/umi';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

// 1. Set up the Solana connection
const connection = new Connection(clusterApiUrl('devnet'));  // or testnet, mainnet

// 2. Load payer keypair (this will be the account paying for the transaction)
const payer = Keypair.generate();  // or load from file

// 3. Set up the UMI context
const context = {
  connection,      // Solana connection
  payer,           // Payer keypair
  cluster: 'devnet' // Choose 'devnet', 'testnet', or 'mainnet'
};

// 4. Initialize UMI
const umi = new Umi(context);

// 5. Define metadata for your NFT
const metadata = {
  name: 'Brunel Student NFT',
  uri: 'https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json',
  sellerFeeBasisPoints: 500, // 5% fee on secondary sales
  tokenStandard: TokenStandard.NonFungible, // NFT standard
};

// 6. Mint the NFT
await createV1(umi, {
  mint: payer.publicKey, // Mint from the payer's public key
  authority: payer.publicKey, // Mint authority (payer)
  ...metadata, // NFT metadata
}).sendAndConfirm(umi);

console.log('NFT minted successfully!');
