pragma solidity 0.5.12;

import "./MVNRecipient.sol";
import "./IRoleRegistry.sol";
import "./RedeemGatewayRoles.sol";
import "./RoleRegistryClient.sol";
import "./Transfers.sol";

contract RedeemGateway is MVNRecipient, RoleRegistryClient {
    using Transfers for mapping(bytes => Transfers.Transfer);
    using RedeemGatewayRoles for IRoleRegistry;

    mapping(uint256 => bytes) private _transferIds;
    mapping(bytes => Transfers.Transfer) private _transfers;
    uint256 private _transfersCount;

    function initialize_v1(
        address mvn,
        address erc1820Registry,
        address roleRegistry
    ) 
        public
        initializer 
    {
        MVNRecipient.initialize_v1(mvn, erc1820Registry);
        RoleRegistryClient.initialize_v1(roleRegistry);
    }

    modifier onlyManager() {
        roleRegistry().requireManagerRole(msg.sender);
        _;
    }

    function transfersCount()
        public view
        returns (uint256)
    {
        return _transfersCount;
    }
    
    function _acceptTransfer(
        bytes memory internalTransferId
    )
        internal
        onlyManager
    {
        require(internalTransferId.length > 0, 'RedeemGateway: internal transfer id is empty');
        require(_transfers.isReceived(internalTransferId), 'RedeemGateway: transfer has not been received');
        require(!_transfers.isAccepted(internalTransferId), 'RedeemGateway: transfer has already been accepted');
        require(!_transfers.isRejected(internalTransferId), 'RedeemGateway: transfer has already been rejected');

        Transfers.Transfer memory transfer = _transfers[internalTransferId];

        transfer.accepted = true;

        _transfers[internalTransferId] = transfer;
        
        mvn().burn(_transfers[internalTransferId].amount, "");
    }

    function _rejectTransfer(
        bytes memory internalTransferId
    )
        internal
        onlyManager
    {
        require(internalTransferId.length > 0, 'RedeemGateway: internal transfer id is empty');
        require(_transfers.isReceived(internalTransferId), 'RedeemGateway: transfer has not been received');
        require(!_transfers.isAccepted(internalTransferId), 'RedeemGateway: transfer has already been accepted');
        require(!_transfers.isRejected(internalTransferId), 'RedeemGateway: transfer has already been rejected');

        Transfers.Transfer memory transfer = _transfers[internalTransferId];

        transfer.rejected = true;
        
        _transfers[internalTransferId] = transfer;
        
        mvn().send(transfer.sender, transfer.amount, "");
    }

    function _tokensReceived(
        address from,
        uint256 amount,
        bytes memory internalTransferId
    )
        internal
        onlyMVN
        returns (uint256)
    {
        require(internalTransferId.length > 0, 'RedeemGateway: internal transfer id is empty');
        require(!_transfers.isAccepted(internalTransferId), 'RedeemGateway: transfer has already been accepted');
        require(!_transfers.isRejected(internalTransferId), 'RedeemGateway: transfer has already been rejected');
        require(!_transfers.isReceived(internalTransferId), 'RedeemGateway: transfer has already been received');

        _transfers[internalTransferId].amount = amount;
        _transfers[internalTransferId].sender = from;
        _transfers[internalTransferId].received = true;

        uint256 transferNumber = _transfersCount++;

        _transfers[internalTransferId].number = transferNumber;
        _transferIds[transferNumber] = internalTransferId;
        
        return transferNumber;
    }

    function _getTransfer(
        uint256 transferNumber
    )
        internal view 
        returns (bytes memory internalTransferId, address from, uint256 amount)
    {
        internalTransferId = _transferIds[transferNumber];
        
        Transfers.Transfer memory transfer = _transfers[internalTransferId];
        
        return (internalTransferId, transfer.sender, transfer.amount);
    }

    function _isAccepted(
        bytes memory internalTransferId
    )
        internal view
        returns (bool)
    {
        return _transfers.isAccepted(internalTransferId);
    }
    
    function _isReceived(
        bytes memory internalTransferId
    )
        internal view
        returns (bool)
    {
        return _transfers.isReceived(internalTransferId);
    }

    function _isRejected(
        bytes memory internalTransferId
    )
        internal view
        returns (bool)
    {
        return _transfers.isRejected(internalTransferId);
    }

    uint256[50] private ______gap;
}
