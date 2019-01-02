import { Injectable } from '@angular/core'
import { Paper } from '@app/modules/publication/models'
import { Observable } from 'rxjs'
import { EthereumService } from '@app/core/services'
import { PublicationService } from '@app/modules/publication/services/publication.service'
import { Contract } from 'ethers'

declare let require: any
const tokenAbiAssetFactory = require('@contracts/AssetFactory.json')

@Injectable({
  providedIn: 'root'
})
export class MyWorkService {

  private readonly PROVIDER: any

  constructor(
    private ethereumService: EthereumService,
    private publicationService: PublicationService
  ) {
    this.PROVIDER = this.ethereumService.getProvider()

    // Workaround issue: https://github.com/ethers-io/ethers.js/issues/386
    this.PROVIDER.getBlockNumber().then(number => this.PROVIDER.resetEventsBlock(number + 1))
  }

  getMyPapers(): Observable<Paper> {
    return Observable.create(async observer => {
      const address = await this.ethereumService.getSCAddress(tokenAbiAssetFactory)
      const instance = new Contract(address, tokenAbiAssetFactory.abi, this.PROVIDER)
      const signer = await this.PROVIDER.getSigner()
      const account = await signer.getAddress()
      const assetsAddress: string[] = await instance.getAssetsByCreator(account)
      assetsAddress.forEach(async address => {
        const paper = await this.publicationService.getPaper(address)
        observer.next(paper)
      })
    })
  }
}
