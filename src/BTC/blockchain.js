const { SHA512 } = require('crypto-js');
const SHA256 = require('crypto-js/sha256');

const EC = require('elliptic').ec; 
const ec = new EC('secp256k1');

class Transaction{ // giao dịch
    constructor(sendAddress, receiveAddress, amount){
        this.sendAddress = sendAddress;
        this.receiveAddress = receiveAddress;
        this.amount = amount; // số lượng
        this.timestamp = Date.now();
    }

    calculateHash(){
         return SHA256(this.sendAddress + this.receiveAddress + this.amount).toString();
    }

    signTransaction(signingKey){
        if (signingKey.getPublic('hex') !== this.sendAddress) {
            console.log('1: ' + signingKey.getPublic('hex'));
            console.log('2: ' + this.sendAddress);

            throw new Error('You cannot sign transaction for other wallets!');
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx,'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        if(this.sendAddress === null) return true;
        if(!this.signature || this.signature.length ===0){
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.sendAddress, 'hex');
        return publicKey.verify(this.calculateHash(),this.signature);
    }
}

class Block{
    constructor( timestamp, transactions, previousHash = ''){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash()
    {
        return SHA256(this.nonce + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
    }

    mineBlock(difficulty){ //đào bằng cách hash cho tới khi xuất hiện giá trị có bắt đầu bằng diff số 0
        while(this.hash.substring(0,difficulty)!=Array(difficulty+1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();

        }
        console.log("Block mined: " + this.hash);
    }

    hasValidTransaction(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }

}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = []; //hàng chờ
        this.miningReward = 100;
    }

    createGenesisBlock(){
        return new Block("Tue Apr 18 2023",[],'0');
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    miningPendingTransactions(miningRewardAddress){ //đào
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        let block = new Block((new Date(Date.now())).toDateString(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [
            //new Transaction(null,miningRewardAddress,this.miningReward)
        ]; //them reward vào hàng chờ cho block sau đó cho nên block sau sẽ lưu reward

    }

    addTransaction(transaction){
        if(!transaction.sendAddress || !transaction.receiveAddress){
            throw new Error ('Transaction must include send and receive address');   
        }

        if(!transaction.isValid()){
            throw new Error('Cannor add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);  
    }

    getBalanceOfAddress(address){
        let balance = 0;

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.sendAddress === address){
                    balance -= trans.amount;
                }

                if(trans.receiveAddress === address){
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainValid(){
        for(let i = 1;i<this.chain.length;i++)
        {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if(!currentBlock.hasValidTransaction()){
                return false;
            }
            if(currentBlock.hash != currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash != previousBlock.hash){
                return false;
            }
        }
        return true;
    }


}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
