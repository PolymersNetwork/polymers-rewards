import { Wormhole, ChainName } from '@wormhole-foundation/sdk';
import { ethers } from 'ethers';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const wormhole = await Wormhole.connect({ /* ... */ });

async function runEndToEndWorkflow(recipient: string) {
    const depositId = await axios.post(process.env.API_URL!, { amount: 1000, contamination: 5, /* ... */ });
    const mint = await triggerNftMint(depositId.data.deposit_id, recipient);
    const vaa = await retrieveVaa(mint);
    const txHash = await submitVaaToEthereum(vaa);
    await supabase.from('nft_bridges').insert({ tx_hash: txHash });
}
