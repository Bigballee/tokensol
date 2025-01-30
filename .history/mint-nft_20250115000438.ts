import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/umi';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

// 1. Set up the Solana connection
const connection = new Connection(clusterApiUrl('devnet'));  // or testnet, mainnet

// 2. Load payer keypair (this will be the account paying for the transaction)
const payer = Keypair.generate();  // or load from file

// 3. Set up the UMI context
const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(payer)); // UMI instance setup

// 4. Define metadata for your NFT
const metadata = {
  name: 'Brunel Student NFT',
  uri: 'https://raw.githubusercontent.com/Bigballee/Solana-NFT-Marketplace/refs/heads/master/assets/example.json',
  sellerFeeBasisPoints: 500, // 5% fee on secondary sales
  tokenStandard: TokenStandard.NonFungible, // NFT standard
};

// 5. Mint the NFT
async function mintNFT() {
  try {
    const { nft } = await metaplex.nfts().create({
      uri: metadata.uri,
      name: metadata.name,
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      tokenStandard: metadata.tokenStandard,
    });

    console.log(`NFT minted successfully! Token Address: ${nft.address.toBase58()}`);
  } catch (error) {
    console.error('Error minting NFT:', error);
  }
}

// Call the mintNFT function
mintNFT();
