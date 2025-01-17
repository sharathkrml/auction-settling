import { BigNumberish, ethers, Interface } from "ethers"
import * as multiCall from "./Multicall.json"
import { aggregate3Calldata, Call3, claimFromParticipantOrderEncodedCalldata, decodeError, decodeResponse } from "./utils"

const MULTICALL_CONTRACT = "0xcA11bde05977b3631167028862bE2a173976CA11"

const EASY_AUCTION = "0x28E8A1817Af21d39d6820Fd930FDE618e03d4d8d" // change it whenever we deploy new contract

const RPC_URL = "" // set RPC url here

const jsonProvider = new ethers.WebSocketProvider(RPC_URL)
// const privateKey = "" //  for actual call
// let wallet = new ethers.Wallet(privateKey, jsonProvider) //  for actual call
// let multiCall3 = new ethers.Contract(MULTICALL_CONTRACT, multiCall, wallet) //  for actual call
let multiCall3 = new ethers.Contract(MULTICALL_CONTRACT, multiCall, jsonProvider)

export interface ClaimOrder {
  auctionId: BigNumberish // get it from subgraph
  encodedOrderId: string[] // get it from subgraph
  reward?: BigNumberish
  refund?: BigNumberish
  error?: string
}

export const calculateRewardAndRefundMultiCall = async (orders: ClaimOrder[]): Promise<ClaimOrder[]> => {
  let calls: Call3[] = []
  for (let order of orders) {
    calls.push({
      target: EASY_AUCTION,
      allowFailure: true, // means transaction won't revert if any of the call fails
      callData: claimFromParticipantOrderEncodedCalldata(order.auctionId, order.encodedOrderId),
    })
  }
  let txResp = await multiCall3.aggregate3.staticCall(calls)
  console.log({
    chainId: "eip155:10",
    method: "eth_sendTransaction",
    params: {
      abi: multiCall, // JSON ABI of the function selector and any errors
      to: MULTICALL_CONTRACT,
      data: aggregate3Calldata(calls),
      value: "",
    },
  })

  for (let i = 0; i < txResp.length; i++) {
    // txResp[i][0] is a boolean that indicates if the call was successful
    if (txResp[i][0]) {
      const { refund, reward } = decodeResponse(txResp[i][1])
      orders[i].refund = refund
      orders[i].reward = reward
    } else {
      const error = decodeError(txResp[i][1])
      orders[i].error = error
    }
  }
  return orders
}

calculateRewardAndRefundMultiCall([
  {
    auctionId: "20",
    encodedOrderId: ["0x0000000000000004000000056bc75e2d631000000000000579a814e10a740000"],
  },
  {
    auctionId: "20",
    encodedOrderId: ["0x00000000000000020000000579a814e10a740000000000058788cb94b1d80000"],
  },
  {
    auctionId: "19",
    encodedOrderId: ["0x00000000000000060000003635c9adc5dea00000000069e11bc81d2a77e40000"],
  },
  {
    // failure case
    auctionId: "4",
    encodedOrderId: ["0x0000000000000002000000000de0b6b3a7640000000000003782dace9d900000"],
  },
]).then((res) => console.log(res))
