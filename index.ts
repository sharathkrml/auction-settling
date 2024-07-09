import { ethers } from "ethers"
import { MulticallWrapper } from "ethers-multicall-provider"
import * as easyAuction from "./EasyAuction.json"

const EASY_AUCTION_ADDRESS = "0x0b7ffc1f4ad541a4ed16b40d8c37f0929158d101"
const RPC_URL = "https://eth.llamarpc.com"

const jsonProvider = new ethers.WebSocketProvider(RPC_URL)
const multiCallProvider = MulticallWrapper.wrap(jsonProvider)
let easyAuctionContract = new ethers.Contract(EASY_AUCTION_ADDRESS, easyAuction, multiCallProvider)
console.log("isMulticallEnabled:", multiCallProvider.isMulticallEnabled)

export interface ClaimOrder {
  auctionId: Number // get it from subgraph
  encodedOrderId: string[] // get it from subgraph
  blockNo: Number // won't be needed for live cases
}

export const calculateRewardAndRefund = async (orders: ClaimOrder[]) => {
  let calls: Promise<unknown>[] = []
  for (let order of orders) {
    let promise = new Promise((resolve, reject) => {
      easyAuctionContract.claimFromParticipantOrder
        .staticCall(order.auctionId, order.encodedOrderId, {
          blockTag: order.blockNo,
        })
        .then((result) => {
          resolve(result)
        })
        .catch((error) => {
          reject(error)
        })
    })
    calls.push(promise)
  }
  let response = await Promise.all(calls)
  for (let i = 0; i < response.length; i++) {
    console.log("reward", response[i][0], "refund", response[i][1])
  }
}

calculateRewardAndRefund([
  {
    // 0xac6797fbc47b89660b25a10c6e65cfae500ee9faa073c366ff11c64eae6d326a
    auctionId: 3,
    encodedOrderId: ["0x0000000000000009000000000175f848ce406bca0000000ad78ebc5ac6200000", "0x00000000000000090000000002ed1d744a5a92490000001400e758f447240000", "0x00000000000000090000000001a1f7606e0bc3c30000000ad78ebc5ac6200000", "0x00000000000000090000000001d9b1f5d20d55550000000ad78ebc5ac6200000"],
    blockNo: 12153558,
  },
  {
    // 0xd509cf3262677ca12ddc2446b99ca900796af581649613b11ab1e8ac773a684f
    auctionId: 3,
    encodedOrderId: ["0x00000000000000080000000007788b508015d5550000003487938e0499840000"],
    blockNo: 12153559,
  },
  {
    // 0xf0f7d422f89e7a821f910a522ecad17b318369efcb70c1f94918b445b63a4ec2
    auctionId: 3,
    blockNo: 12153560,
    encodedOrderId: ["0x00000000000000070000000007bcb3411ba9264b0000003666cc61ca7d554076"],
  },
])
