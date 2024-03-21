# Monitor Staking Contract
## Description
This is a web3 action script designed to monitor withdrawal events from a staking contract and trigger alerts when certain conditions are met.

## Configuration
1. Add your contract to Tenderly, make sure it is verified on Tenderly, if it is verified on public explorer import to your Tenderly project.
2. Set up a PagerDuty integration and obtain the PagerDuty URL and key.
3. Add RPC, Pagerduty URL, Staking contract address, Staking contract ABI, Rewards Processed in Tendelry storage, and Pagerduty key in Tenderly secrets with names as specified in web3 action.
4. Login to Tenderly via tenderly CLI https://docs.tenderly.co/web3-actions/tutorials-and-quickstarts/deploy-web3-action-via-cli, and deploy the action via:
    ```bash
    tenderly actions deploy
    ```
5. Create an alert or withdraw event in Tenderly project and add this web3 action as destination.

## Functionality
- The `handleWithdraw` function processes withdrawal events from a staking contract.
- It calculates the total rewards processed and compares it with the yield limit.
- If the rewards cross a specified threshold (75% of the yield limit), it triggers an alert to PagerDuty.
- Alerts include information such as the chain name, event details, and reward amounts.

## Dependencies
Don't need to create a `package.json` as these dependencies are available by default for tenderly web3 actions.
- ethers.js
- axios
