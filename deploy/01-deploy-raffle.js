const { network } = require("hardhat");

require("dotenv").config()

module.exports = async ({deployments, getNamedAccounts})=>{
    const {deploy} = deployments;
    const {deployer} =  await getNamedAccounts()

    const args = []
    console.log("deploying Raffle contract...")
    const Raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    console.log("Raffle contract deployed.")
}

