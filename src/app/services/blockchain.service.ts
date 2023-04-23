import { Injectable } from '@angular/core';
import { Blockchain } from '../../BTC/blockchain.js';
const EC = require('elliptic');

@Injectable({
  providedIn: 'root'
})
export class BlockchainService
{
  public blockchainInstance = new Blockchain();
  public walletKeys: any[] = [];

  constructor()
  {
    this.blockchainInstance.difficulty = 2;
    this.blockchainInstance.miningPendingTransactions('test-address');

    this.generateWalletKeys();
  }

  getBlocks()
  {
    return this.blockchainInstance.chain;
  }

  addressIsFromCurrentUser(address)
  {
    return address === this.walletKeys[0].publicKey;
  }

  addTransaction(tx)
  {
    this.blockchainInstance.addTransaction(tx);
  }

  getPendingTransactions()
  {
    return this.blockchainInstance.pendingTransactions;
  }

  minePendingTransactions()
  {
    this.blockchainInstance.miningPendingTransactions(this.walletKeys[0].publicKey);
  }

  private generateWalletKeys()
  {
    const ec = new EC.ec('secp256k1');
    const key = ec.genKeyPair();

    this.walletKeys.push({
      keyObj: key,
      publicKey: key.getPublic('hex'),
      privateKey: key.getPrivate('hex')
    })
  }
}
