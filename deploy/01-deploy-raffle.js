const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../verify");

require("dotenv").config();

const SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther("2");
const chainID = network.config.chainId;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  let VRFCoordinatorV2Address, subscriptionId, VRFCoordinatorV2Mock;
  if (developmentChains.includes(network.name)) {
    VRFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address;
    //getting subscriptionId for a local chain
    const transactionResponse =
      await VRFCoordinatorV2Mock.createSubscription();
    const transactionReciept = await transactionResponse.wait();
    subscriptionId = transactionReciept.events[0].args.subId;
    await VRFCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      SUBSCRIPTION_FUND_AMOUNT
    );
  } else {
    VRFCoordinatorV2Address =
      networkConfig[chainID]["VRFCoordinatorAddress"];
    subscriptionId = networkConfig[chainID]["subscriptionId"];
  }

  const enteranceFee =
    networkConfig[chainID]["enteranceFee"] ||
    ethers.utils.parseEther("0.01");
  const gasLane = networkConfig[chainID]["gasLane"];
  const callbackGasLimit = networkConfig[chainID]["callbackGasLimit"];
  const interval = networkConfig[chainID]["interval"];

  const args = [
    VRFCoordinatorV2Address,
    enteranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];

  console.log("\n\ndeploying Raffle contract...");
  const Raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  console.log("Raffle contract deployed.");

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("verifying contract...");
    await verify(Raffle.address, args);
    console.log("verified succesfully.");
  }
};

module.exports.tags = ["all", "raffle"];
