pragma solidity 0.5.12;

import "./MVNGatewayRoles.sol";
import "./MVNRecipient.sol";
import "./IHaveVersion.sol";
import "./RoleRegistryClient.sol";

contract MVNGateway is MVNRecipient, RoleRegistryClient, IHaveVersion {
    using MVNGatewayRoles for IRoleRegistry;
    
    mapping(address => address) _internalAccounts;
    uint256 private _outgoingTransfersCount;
    mapping(uint256 => bool) _processedIncomingTransfers;
    mapping(address => address) _publicAccounts;
    uint256 private _transferToPublicNetworkFee;
    address private _treasuryAccount;
    uint256 private _version;

    event PublicAccountLinked(
        address indexed internalAccount,
        address indexed publicAccount
    );

    event PublicAccountUnlinked(
        address indexed internalAccount,
        address indexed publicAccount
    );

    event TransferredFromPublicNetwork(
        address indexed publicAccount,
        address indexed internalAccount,
        uint256 indexed publicTransferId,
        uint256 amount
    );

    event TransferredToPublicNetwork(
        address indexed internalAccount,
        address indexed publicAccount,
        uint256 indexed internalTransferId,
        uint256 amount
    );
    
    event TransferToPublicNetworkFeeSet(
        uint256 amount
    );
    
    event TreasuryAccountSet(
        address indexed account
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
        MVNRecipient.initialize_v1(mvn, erc1820Registry);
        RoleRegistryClient.initialize_v1(roleRegistry);
        
        _version = 1;
    }
    
    function version()
        external view
        returns (uint256)
    {
        return _version;
    }

    /* -- Contract implementation -- */

    modifier onlyBridge() {
        roleRegistry().requireBridgeRole(msg.sender);
        _;
    }
    
    modifier onlyLinker() {
        roleRegistry().requireLinkerRole(msg.sender);
        _;
    }

    modifier onlyManager() {
        roleRegistry().requireManagerRole(msg.sender);
        _;
    }

    modifier onlyOwner() {
        roleRegistry().requireOwnerRole(msg.sender);
        _;
    }
    
    function linkPublicAccount(
        address internalAccount,
        address publicAccount,
        uint256 linkingFee 
    )
        external 
        onlyLinker
    {
        require(publicAccount != address(0), "MVNGateway: public account is the zero address");

        if (linkingFee > 0) {
            mvn().collectFee(internalAccount, _treasuryAccount, linkingFee, "Fee for Ethereum account linking");
        }
        
        if (getPublicAccount(internalAccount) != address(0)) {
            unlinkPublicAccount(internalAccount);
        }
        
        _internalAccounts[publicAccount] = internalAccount;
        _publicAccounts[internalAccount] = publicAccount;

        emit PublicAccountLinked(internalAccount, publicAccount);
    }
    
    function setTransferToPublicNetworkFee(
        uint256 amount
    )
        external
        onlyManager
    {
        _transferToPublicNetworkFee = amount;
        
        emit TransferToPublicNetworkFeeSet(amount);
    }
    
    function setTreasuryAccount(
        address account
    )
        external
        onlyOwner
    {
        require(account != address(0), 'MVNGateway: account is the zero address');
        
        _treasuryAccount = account;
        
        emit TreasuryAccountSet(account);
    }
    
    function tokensReceived(
        address /* operator */,
        address from,
        address /* to */,
        uint256 amount,
        bytes calldata /* data */,
        bytes calldata /* operatorData */
    )
        external
        onlyMVN
    {
        require(from != address(0), "MVNGateway: from is the zero address");
        
        address publicAccount = _publicAccounts[from];
        
        require(publicAccount != address(0), "MVNGateway: public account is not linked");
        
        if (_transferToPublicNetworkFee > 0) {
            mvn().collectFee(from, _treasuryAccount, _transferToPublicNetworkFee, "Fee for transfer to Ethereum network");
        }
        
        emit TransferredToPublicNetwork(from, publicAccount, _outgoingTransfersCount++, amount);
    }

    function transferFromPublicNetwork(
        address publicAccount,
        address internalAccount,
        uint256 publicTransferId,
        uint256 amount
    )
        external
        onlyBridge
    {
        require(publicAccount != address(0), "MVNGateway: public account is the zero address");
        require(internalAccount != address(0), "MVNGateway: internal account is the zero address");
        require(!_processedIncomingTransfers[publicTransferId], "MVNGateway: incoming transfer has already been processed");
        
        mvn().send(internalAccount, amount, "");
        
        emit TransferredFromPublicNetwork(publicAccount, internalAccount, publicTransferId, amount);

        _processedIncomingTransfers[publicTransferId] = true;
    }
    
    function isProcessed(
        uint256 publicTransferId
    )
        external view
        returns (bool)
    {
        return _processedIncomingTransfers[publicTransferId];
    }
    
    function transferToPublicNetworkFee()
        external view
        returns (uint256)
    {
        return _transferToPublicNetworkFee;
    }

    function treasuryAccount()
        external view
        returns (address)
    {
        return _treasuryAccount;
    }
    
    function unlinkPublicAccount(
        address internalAccount
    )
        public
        onlyLinker
    {
        address publicAccount = getPublicAccount(internalAccount);

        require(publicAccount != address(0), "MVNGateway: public account is not linked");

        _internalAccounts[publicAccount] = address(0);
        _publicAccounts[internalAccount] = address(0);

        emit PublicAccountUnlinked(internalAccount, publicAccount);
    }

    function getInternalAccount(
        address publicAccount
    )
        public view
        returns (address)
    {
        require(publicAccount != address(0), "MVNGateway: public account is the zero address");

        return _internalAccounts[publicAccount];
    }
    
    function getPublicAccount(
        address internalAccount
    )
        public view
        returns (address)
    {
        require(internalAccount != address(0), "MVNGateway: internal account is the zero address");

        return _publicAccounts[internalAccount];
    }

    uint256[50] private ______gap;
}
