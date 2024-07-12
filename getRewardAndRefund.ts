import { BigNumberish, ethers, Interface } from "ethers"

const RPC_URL = "" // set RPC url here
const jsonProvider = new ethers.WebSocketProvider(RPC_URL)

const MOXIE_TOKEN_ADDRESS = "0xf80945fc1436b0ae8b86c8835f09870deeaf03d5" // change it whenever we deploy new contract

const ERC20_TRANSFER_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // encoded signature of Transfer event

const getRewardAndRefundFromClaimHash = async (hash: string) => {
  let rewards: Transfer[] = []
  let refund: Transfer[] = []
  const transactionReceipt = await jsonProvider.getTransactionReceipt(hash)
  for (let log of transactionReceipt.logs) {
    if (log.topics[0] === ERC20_TRANSFER_SIG) {
      const transfer = decodeTransferEvent(log)
      if (transfer.token === MOXIE_TOKEN_ADDRESS) {
        // transfering moxie means refund
        refund.push(transfer)
      } else {
        rewards.push(transfer)
      }
    }
  }
  console.log({ rewards, refund })
  return { rewards, refund }
}

getRewardAndRefundFromClaimHash("0x8e543f3ae72910a461bb3ce852acfcae7406d2623f660261ced4087a95d54a0b")

interface Transfer {
  token: string
  from: string
  to: string
  value: BigNumberish
}

const decodeTransferEvent = (log: ethers.Log) => {
  const iface = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"])
  const decoded = iface.decodeEventLog("Transfer", log.data, log.topics)
  let transfer: Transfer = {
    token: log.address,
    from: decoded.from,
    to: decoded.to,
    value: decoded.value,
  }
  return transfer
}
