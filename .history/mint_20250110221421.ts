import { getKeypairFromFile } from "@solana-developers/helpers";
import { ExtensionType, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, getMintLen, getMint, getTokenMetadata } from "@solana/spl-token";
import { TokenMetadata, createInitializeInstruction, createUpdateFieldInstruction, pack} from "@solana/spl-token-metadata";
import { Connection,Keypair,SystemProgram,Transaction,clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";

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
    const mintSpace = getMintLen([
        ExtensionType.MetadataPointer
    ])

    const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length

    const lamports = await connection.getMinimumBalanceForRentExemption(
        mintSpace + metadataSpace
    )
        
    const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintSpace,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID
    })

    const initializeMetadataPointerIx = createInitializeMetadataPointerInstruction(
        mint.publicKey,
        payer.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
    )

    const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        2, //decimals
        payer.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
    )


    const initializeMetadataIx = createInitializeInstruction({
        mint: mint.publicKey,
        metadata: mint.publicKey,
        mintAuthority: payer.publicKey,
        name: metadata.name,
        symbol: metadata.symbol
        uri: metadata.uri,
        programId: TOKEN_2022_PROGRAM_ID,
        updateAuthority: payer.publickey
    })

    const updateMetaField = createUpdateFieldInstruction({
        metadata: mint.publicKey,
        programId: TOKEN_2022_PROGRAM_ID,
        updateAuthority: payer.publicKey,
        field: metadata.additionalMetadata[0][0],
        value: metadata.additionalMetadata[0][1]
    })

    const transaction = new Transaction().add(
        createAccountIx,
        initializeMetadataPointerIx,
        initializeMintIx,
        //
        initializeMetadataIx,
        updateMetaField
    )

    const sig = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mint]
    )
    
    console.log("sig", sig);

    const chainMetadata = await getTokenMetadata(
        connection,
        mint.publicKey
    )

     console.log(chainMetadata);

