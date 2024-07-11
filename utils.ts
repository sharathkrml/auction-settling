import { BigNumberish, Interface, AbiCoder } from "ethers"
const ABI = ["function aggregate3(tuple(address target,bool allowFailure,bytes callData)[])", "function claimFromParticipantOrder(uint256 auctionId,bytes32[] memory orders)", "function auctionData(uint256)"]
const iface = new Interface(ABI)
const DEFAULT_ABICODER = new AbiCoder()

export function claimFromParticipantOrderEncodedCalldata(auctionId: BigNumberish, encodedOrderId: string[]) {
  return iface.encodeFunctionData("claimFromParticipantOrder", [auctionId, encodedOrderId])
}

export function auctionDataCalldata(auctionId: BigNumberish) {
  return iface.encodeFunctionData("auctionData", [auctionId])
}

export function aggregate3Calldata(calls: Call3[]) {
  return iface.encodeFunctionData("aggregate3", [calls])
}

export function decodeError(errorStr: string) {
  errorStr = "0x" + errorStr.split("0x08c379a0")[1]
  let decodedError = DEFAULT_ABICODER.decode(["string"], errorStr)
  return decodedError[0]
}

export function decodeResponse(response: string) {
  let decodedResponse = DEFAULT_ABICODER.decode(["uint256", "uint256"], response)
  let reward = decodedResponse[0]
  let refund = decodedResponse[1]
  return { reward, refund }
}

export interface Call3 {
  target: string
  allowFailure: boolean
  callData: string
}
