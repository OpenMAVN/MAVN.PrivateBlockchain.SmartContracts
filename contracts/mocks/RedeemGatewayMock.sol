pragma solidity 0.5.12;

import "../RedeemGateway.sol";

contract RedeemGatewayMock is RedeemGateway {

    function acceptTransfer(
        bytes calldata internalTransferId
    )
        external
    {
        _acceptTransfer(internalTransferId);
    }

    function rejectTransfer(
        bytes calldata internalTransferId
    )
        external
    {
        _rejectTransfer(internalTransferId);
    }

    function tokensReceived(
        address /* operator */,
        address from,
        address /* to */,
        uint256 amount,
        bytes calldata data,
        bytes calldata /* operatorData */
    )
        external
    {
        _tokensReceived(from, amount, data);
    }

    function getTransfer(
        uint256 transferNumber
    )
        external view
        returns (bytes memory internalTransferId, address from, uint256 amount)
    {
        (internalTransferId, from, amount) = _getTransfer(transferNumber);
        
        return (internalTransferId, from, amount);
    }
    
    function isAccepted(
        bytes calldata internalTransferId
    )
        external view
        returns (bool)
    {
        return _isAccepted(internalTransferId);
    }
    
    function isReceived(
        bytes calldata internalTransferId
    )
        external view
        returns (bool)
    {
        return _isReceived(internalTransferId);
    }

    function isRejected(
        bytes calldata internalTransferId
    )
        external view
        returns (bool)
    {
        return _isRejected(internalTransferId);
    }

    // Causes a compilation error if super._acceptTransfer is not internal
    function _acceptTransfer(
        bytes memory internalTransferId
    )
        internal
    {
        super._acceptTransfer(internalTransferId);
    }

    // Causes a compilation error if super._rejectTransfer is not internal
    function _rejectTransfer(
        bytes memory internalTransferId
    )
        internal
    {
        super._rejectTransfer(internalTransferId);
    }

    // Causes a compilation error if super._tokensReceived is not internal
    function _tokensReceived(
        address from,
        uint256 amount,
        bytes memory internalTransferId
    )
        internal
        returns (uint256)
    {
        return super._tokensReceived(from, amount, internalTransferId);
    }
    
}
