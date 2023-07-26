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
          //moving to the new block to get the updated timestamp
          await ethers.provider.send("evm_mine");

          //performing upkeep to set Raffel State to false
          await raffle.performUpkeep([]);
          await expect(
            raffle.enterRaffle({ value: sendETH })
          ).to.be.revertedWith("Raffle__LotteryNotOpen");

          //checking if the event was emitted
        });

        it("checks if the event was emitted", async () => {
          const tx = await raffle.enterRaffle({ value: sendETH });
          const reciept = await tx.wait(1);

          const player = reciept.events[0].args.player;
          expect(player).to.equal(deployer);
        });

        it("checks if the player array was updated successfully", async () => {
          const tx = await raffle.enterRaffle({ value: sendETH });

          const player = await raffle.getPlayer(0);
          expect(player).to.equal(deployer);
        });
      });

      describe("testing checkUpKeep method", () => {
        it("returns false if we dont have any balance", async () => {
          //MAKING SURE THE INTERVAL HAS PASSED
          let currentTimestamp = (await ethers.provider.getBlock())
            .timestamp;
          const nextBlockTimeStamp =
            currentTimestamp + Number(interval) + 1;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            nextBlockTimeStamp,
          ]);
          //moving to the new block to get the updated timestamp
          await ethers.provider.send("evm_mine");

          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          expect(upkeepNeeded).to.equal(false);
        });

        it("returns false if not enough time passed", async () => {
          //we are using callStatic because we need return values
          //we dont actually want to send a transaction
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          expect(upkeepNeeded).to.equal(false);
        });
      });

      describe("Testing performUpKeep method", () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: sendETH });
        });

        describe("testing when enough time has passed", () => {
          beforeEach(async () => {
            let currentTimestamp = (await ethers.provider.getBlock())
              .timestamp;
            const nextBlockTimeStamp =
              currentTimestamp + Number(interval) + 1;
            await ethers.provider.send("evm_setNextBlockTimestamp", [
              nextBlockTimeStamp,
            ]);
            //moving to the new block to get the updated timestamp
            await ethers.provider.send("evm_mine");
          });

          it("emits an event when succesfull", async () => {
            //performing upkeep to set Raffel State to false
            const tx = await raffle.performUpkeep([]);
            const reciept = await tx.wait(1);
            const requestId = reciept.events[1].args.requestId;

            expect(requestId.toString()).to.be.equal("1");
          });

          it("Updates raffle state to calculating", async () => {
            await raffle.performUpkeep([]);
            const raffleState = await raffle.getRaffleState();
            expect(Number(raffleState)).to.equal(1);
          });
        });
      });
    });
