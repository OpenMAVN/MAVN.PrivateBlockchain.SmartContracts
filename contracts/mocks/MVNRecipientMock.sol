pragma solidity 0.5.12;

import "../MVNRecipient.sol";

contract MVNRecipientMock is MVNRecipient {

    function onlyMVNMock()
        public view
        onlyMVN
    {
        // solhint-disable-previous-line no-empty-blocks
    }
    
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint amount,
        bytes calldata userData,
        bytes calldata operatorData
    )
        external
    {
        // solhint-disable-previous-line no-empty-blocks
    }
    
}
