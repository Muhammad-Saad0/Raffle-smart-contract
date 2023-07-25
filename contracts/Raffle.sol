// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Raffle__NotEnoughEthEntered();
error Raffle__TransferFailed();
error Raffle__LotteryNotOpen();
error Raffle__UpKeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffleState
);

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /*Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    /*State Variable*/
    uint256 private immutable i_enteranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_VRFCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;
    RaffleState s_raffleState;
    address private s_recentWinner;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /*Events */
    event RaffleEntered(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        uint256 enteranceFee,
        address _VRFCoordinator,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(_VRFCoordinator) {
        i_enteranceFee = enteranceFee;
        i_VRFCoordinator = VRFCoordinatorV2Interface(_VRFCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_enteranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__LotteryNotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    /**
     * @dev This function is called by chainlink
     * keeper node so this funtion runs offchain
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (s_raffleState == RaffleState.OPEN);
        bool timePassed = (block.timestamp - s_lastTimeStamp > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && timePassed && hasBalance && hasPlayers);
        return (upkeepNeeded, "");
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        /*gasLane will determine max gas price
        we willing to pay to get the random numbers*/

        /*callback gas limit basically
        determines how much gas can
        fulfillRandomWords function can take */
        uint256 requestId = i_VRFCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_raffleState = RaffleState.CALCULATING;
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        s_raffleState = RaffleState.OPEN;
        emit WinnerPicked(recentWinner);
    }

    /*getters */
    function getEnteranceFee() public view returns (uint256) {
        return i_enteranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    //This is a pure function because it is reading a constant
    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }
}
