pragma solidity 0.5.12;

import "./IHaveVersion.sol";
import "./RedeemGateway.sol";

contract HospitalityRedeemGateway is RedeemGateway, IHaveVersion {

    uint256 private _version;
    
    event TransferAccepted(
        string partnerId,
        string locationId,
        int64 timestamp,
        string customerId,
        string transferId
    );

    event TransferReceived(
        address indexed from,
        uint256 amount,
        string partnerId,
        string locationId,
        int64 timestamp,
        string customerId,
        string transferId,
        uint256 transferNumber
    );

    event TransferRejected(
        string partnerId,
        string locationId,
        int64 timestamp,
        string customerId,
        string transferId
    );
    
    /* -- Contract initialization and upgrades -- */

    function initialize_v1(
        address mvn,
        address erc1820Registry,
        address roleRegistry
    )
        public
        initializer
    {
        RedeemGateway.initialize_v1(mvn, erc1820Registry, roleRegistry);
        
        _version = 1;
    }

    function version()
        external view
        returns (uint256)
    {
        return _version;
    }

    /* -- Contract implementation -- */

    function acceptTransfer(
        string calldata partnerId,
        string calldata locationId,
        int64 timestamp,
        string calldata customerId,
        string calldata transferId
    )
        external
        onlyManager
    {
        bytes memory internalTransferId = abi.encode(partnerId, locationId, timestamp, customerId, transferId);

        _acceptTransfer(internalTransferId);

        emit TransferAccepted(partnerId, locationId, timestamp, customerId, transferId);
    }

    function getTransfer(
        uint256 transferNumber
    )
        external view
        returns (address from, uint256 amount, string memory partnerId, string memory locationId, int64 timestamp, string memory customerId, string memory transferId)
    {
        bytes memory internalTransferId;

        (internalTransferId, from, amount) = _getTransfer(transferNumber);
        (partnerId, locationId, timestamp, customerId, transferId) = abi.decode(internalTransferId, (string, string, int64, string, string));

        return (from, amount, partnerId, locationId, timestamp, customerId, transferId);
    }

    function isAccepted(
        string memory partnerId,
        string memory locationId,
        int64 timestamp,
        string memory customerId,
        string memory transferId
    )
        public view 
        returns (bool)
    {
        bytes memory internalTransferId = abi.encode(partnerId, locationId, timestamp, customerId, transferId);

        return _isAccepted(internalTransferId);
    }

    function isReceived(
        string memory partnerId,
        string memory locationId,
        int64 timestamp,
        string memory customerId,
        string memory transferId
    )
        public view 
        returns (bool)
    {
        bytes memory internalTransferId = abi.encode(partnerId, locationId, timestamp, customerId, transferId);

        return _isReceived(internalTransferId);
    }

    function isRejected(
        string memory partnerId,
        string memory locationId,
        int64 timestamp,
        string memory customerId,
        string memory transferId
    )
        public view 
        returns (bool)
    {
        bytes memory internalTransferId = abi.encode(partnerId, locationId, timestamp, customerId, transferId);

        return _isRejected(internalTransferId);
    }

    function rejectTransfer(
        string calldata partnerId,
        string calldata locationId,
        int64 timestamp,
        string calldata customerId,
        string calldata transferId
    )
        external 
        onlyManager
    {
        bytes memory internalTransferId = abi.encode(partnerId, locationId, timestamp, customerId, transferId);

        _rejectTransfer(internalTransferId);

        emit TransferRejected(partnerId, locationId, timestamp, customerId, transferId);
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
        require(from != address(0), "HospitalityRedeemGateway: from is the zero address");
        
        (string memory partnerId, string memory locationId, int64 timestamp, string memory customerId, string memory transferId) = abi.decode(data, (string, string, int64, string, string));

        uint256 transferNumber = _tokensReceived(from, amount, data);

        emit TransferReceived(from, amount, partnerId, locationId, timestamp, customerId, transferId, transferNumber);
    }

    uint256[50] private ______gap;
}
