import { getKeypairFromFile } from "@solana-developers/helpers";
import { TokenMetadata } from "@solana/spl-token-metadata";
import { Connection,Keypair,clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"))

const payer = await getKeypairFromFile("~/.config/solana/id.json")
console.log("payer", payer.publicKey.toBase58())



const mint = Keypair.generate();
console.log("mint", mint.publicKey.toBase58())

const metadata : TokenMetadata= {
    mint: mint.publicKey,
    name: "Student Nft",
    symbol: "BRUN",
    uri: "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json",
    additionalMetadata: [
        ["key", "value"]
    ]


}