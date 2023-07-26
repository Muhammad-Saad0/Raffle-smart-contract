const { expect, assert } = require("chai");
const {
  ethers,
  deployments,
  getNamedAccounts,
  network,
} = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

const sendETH = ethers.utils.parseEther("1");
const chainID = network.config.chainId;
const interval = networkConfig[chainID]["interval"];

console.log(interval);

console.log(network.name);
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle unit testing", () => {
      let raffle, deployer, vrfCoordinatorMock;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer);
        vrfCoordinatorMock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
      });

      describe("checking the enter raffle functionality", () => {
        it("checks the enterance fee", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle__NotEnoughEthEntered"
          );
        });

        it("checks the raffle state before letting the player enter", async () => {
          //setting the raffle state to false

          await raffle.enterRaffle({ value: sendETH });
          let currentTimestamp = (await ethers.provider.getBlock())
            .timestamp;
          const nextBlockTimeStamp =
            currentTimestamp + Number(interval) + 1;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            nextBlockTimeStamp,
          ]);
          await ethers.provider.send("evm_mine");

          //performing upkeep to set Raffel State to false
          await raffle.performUpkeep([]);
          await expect(
            raffle.enterRaffle({ value: sendETH })
          ).to.be.revertedWith("Raffle__LotteryNotOpen");
        });
      });
    });
