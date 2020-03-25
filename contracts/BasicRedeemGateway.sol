pragma solidity 0.5.12;

import "./IHaveVersion.sol";
import "./RedeemGateway.sol";

contract BasicRedeemGateway is RedeemGateway, IHaveVersion {

    uint256 private _version;

    event TransferAccepted(
        string campaignId,
        string invoiceId,
        string transferId
    );

    event TransferReceived(
        address indexed from,
        uint256 amount,
        string campaignId,
        string invoiceId,
        string transferId,
        uint256 transferNumber
    );

    event TransferRejected(
        string campaignId,
        string invoiceId,
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
        string calldata campaignId,
        string calldata invoiceId,
        string calldata transferId
    )
        external
        onlyManager
    {
        bytes memory internalTransferId = abi.encode(campaignId, invoiceId, transferId);
        
        _acceptTransfer(internalTransferId);
        
        emit TransferAccepted(campaignId, invoiceId, transferId);
    }
    
    function getTransfer(
        uint256 transferNumber
    )
        external view
        returns (address from, uint256 amount, string memory campaignId, string memory invoiceId, string memory transferId)
    {
        bytes memory internalTransferId;
        
        (internalTransferId, from, amount) = _getTransfer(transferNumber);
        (campaignId, invoiceId, transferId) = abi.decode(internalTransferId, (string, string, string));
        
        return (from, amount, campaignId, invoiceId, transferId);
    }
    
    function isAccepted(
        string memory campaignId,
        string memory invoiceId,
        string memory transferId
    )
        public view
        returns (bool)
    {
        bytes memory internalTransferId = abi.encode(campaignId, invoiceId, transferId);
        
        return _isAccepted(internalTransferId);
    }

    function isReceived(
        string memory campaignId,
        string memory invoiceId,
        string memory transferId
    )
        public view
        returns (bool)
    {
        bytes memory internalTransferId = abi.encode(campaignId, invoiceId, transferId);

        return _isReceived(internalTransferId);
    }
    
    function isRejected(
        string memory campaignId,
        string memory invoiceId,
        string memory transferId
    )
        public view 
        returns (bool)
    {
        bytes memory internalTransferId = abi.encode(campaignId, invoiceId, transferId);

        return _isRejected(internalTransferId);
    }

    function rejectTransfer(
        string calldata campaignId,
        string calldata invoiceId,
        string calldata transferId
    )
        external
        onlyManager
    {
        bytes memory internalTransferId = abi.encode(campaignId, invoiceId, transferId);
        
        _rejectTransfer(internalTransferId);

        emit TransferRejected(campaignId, invoiceId, transferId);
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
        require(from != address(0), "BasicRedeemGateway: from is the zero address");
        
        (string memory campaignId, string memory invoiceId, string memory transferId) = abi.decode(data, (string, string, string));

        uint256 transferNumber = _tokensReceived(from, amount, data);

        emit TransferReceived(from, amount, campaignId, invoiceId, transferId, transferNumber);
    }

    uint256[50] private ______gap;
}
