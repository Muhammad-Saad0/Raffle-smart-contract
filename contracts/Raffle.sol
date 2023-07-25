// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

error Raffle__NotEnoughEthEntered();

contract Raffle {
    /*State Variable*/
    uint256 private immutable i_enteranceFee;
    address payable[] private s_players;

    /*Events */
    event RaffleEntered(address indexed player);

    constructor(uint256 enteranceFee) {
        i_enteranceFee = enteranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_enteranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    function getEnteranceFee() public view returns (uint256) {
        return i_enteranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
