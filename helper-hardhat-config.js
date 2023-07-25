const networkConfig = {
    11155111: {
      name: "sepolia",
      VRFCoordinatorAddress:
        "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    },
  };
  
  const developmentChains = [
    "hardhat",
    "localhost",
  ];
  
  const DECIMALS = 8;
  const INITIAL_ANSWER = 2000;
  
  module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
  };
  