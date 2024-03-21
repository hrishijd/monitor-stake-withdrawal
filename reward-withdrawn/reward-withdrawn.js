const { ethers } = require("ethers");
const {
  utils: { toUtf8Bytes, keccak256, defaultAbiCoder },
  providers: { JsonRpcProvider },
} = ethers;
const axios = require("axios").default;

const handleWithdraw = async (context, event) => {
  if (!event || !event.logs || !context || !context.metadata) {
    throw new Error("MalformedData");
  }

  const WITHDRAWN_EVENT = "Withdrawn(address,uint256,uint256)";
  const withdrawnSignature = keccak256(toUtf8Bytes(WITHDRAWN_EVENT)); // calculate event signature

  const chainName = context.metadata.getNetwork();
  const PausableStakeAddress = await context.storage.getStr("StakingContract");
  const PausableStakeABI = await context.storage.getJson("StakingContractABI");
  let amount = await context.storage.getNumber("RewardsProcessed");
  const rpc = (await context.storage.getJson("RPCs"))[chainName];
  const provider = new JsonRpcProvider(rpc);

  const yieldLimit = (
    await new Contract(PausableStakeAddress, PausableStakeABI, provider)
  )
    .yieldLimit()
    .getNumber();

  for (const log of event.logs) {
    const eventHash = log.topics[0]; // event signature from logs

    if (eventHash !== withdrawnSignature) {
      continue;
    }

    if (log.data.length <= 2) {
      throw new Error("InvalidLogData");
    }

    amount += defaultAbiCoder
      .decode(["uint256", "uint256"], log.data)[1]
      .getNumber();
  }

  await context.storage.putNumber("RewardsProcessed", amount);

  let triggerAlert = false;

  if (yieldLimit * 0.75 <= amount) {
    triggerAlert = true;
  }

  if (triggerAlert) {
    try {
      await sendAlert(context, {
        summary:
          "Pausable Stake: Rewards crossed 75% threshold for yield limit",
        source: `${chainName}-${event.hash}`,
        severity: "info",
        custom_details: {
          timestamp: Date.now(),
          chain_name: chainName,
          trigger_event: event,
          amount_info: {
            total_rewards: amount,
            yield_limit: yieldLimit,
          },
        },
      });
    } catch (error) {
      console.error("Unable to alert PagerDuty: ", error.response.data);
      throw new Error("Unable to alert PagerDuty");
    }
  }
};

async function sendAlert(context, payload) {
  await axios.post(
    `${await context.storage.getStr("PagerDutyURL")}`,
    {
      routing_key: await context.secrets.get("PAGERDUTY__KEY"),
      event_action: "trigger",
      payload,
    },
    {
      "Content-Type": "application/json",
    }
  );
}

module.exports = { handleWithdraw };
