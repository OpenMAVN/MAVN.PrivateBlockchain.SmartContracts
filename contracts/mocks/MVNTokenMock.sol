pragma solidity 0.5.12;

import "../MVNToken.sol";

contract MVNTokenMock is MVNToken {
    
    function move(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    )
        external
    {
        _move(operator, from, to, amount, userData, operatorData);
    }
}
