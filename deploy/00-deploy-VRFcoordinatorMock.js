const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

//base fee is the minimum fee required to initiate a request for random words.
const BASE_FEE = ethers.utils.parseEther("0.25");

//This is link per gas
const GAS_PRICE_LINK = 1e9;

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	if (developmentChains.includes(network.name)) {
		const args = [BASE_FEE, GAS_PRICE_LINK];
		console.log("\n\nlocal network detected, deploying mocks...");
		await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			args: args,
			log: true,
		});
		console.log("mocks deployed.");
		console.log(
			"-----------------------------------------------------------"
		);
	}
};

module.exports.tags = ["all", "mocks"];
