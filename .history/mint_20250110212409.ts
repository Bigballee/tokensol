import { getKeypairFromFile } from "@solana-developers/helpers";
import { Connection,Keypair,clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"))

const payer = await getKeypairFromFile("~/.config/solana/id.json")

const mint = Keypair.generate();


console.log("mint", mint.publicKey.toBase58())