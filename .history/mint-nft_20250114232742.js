import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

// Initialize UMI context
const umi = {
  // Your UMI context configuration here
};

// Generate a new signer for the mint
const mint = generateSigner(umi);

// Define the metadata for your NFT
const metadata = {
  name: 'Student NFT ',
  uri: 'https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json',
  sellerFeeBasisPoints: percentAmount(5.5), // 5.5% seller fee
  tokenStandard: TokenStandard.NonFungible,
};

// Create the mint and metadata accounts
await createV1(umi, {
  mint,
  authority: mint.publicKey,
  ...metadata,
}).sendAndConfirm(umi);

console.log(`NFT Minted: ${mint.publicKey.toBase58()}`);
