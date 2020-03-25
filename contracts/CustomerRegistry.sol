pragma solidity 0.5.12;

import "./CustomerRegistryRoles.sol";
import "./Customers.sol";
import "./IHaveVersion.sol";
import "./RoleRegistryClient.sol";

contract CustomerRegistry is RoleRegistryClient, IHaveVersion {
    using CustomerRegistryRoles for IRoleRegistry;
    
    mapping (string => address) private _customerAddresses;
    mapping (address => string) private _customerIds;
    mapping (string => uint256) private _customerIndexes;
    mapping (uint256 => Customers.Customer) private _customers;
    uint256 private _customersCount;
    uint256 private _version;

    event CustomerRegistered(
        string customerId,
        string indexed customerIdIndex,
        address indexed customerAddress
    );
    
    event CustomerUpdated(
        string customerId,
        string indexed customerIdIndex,
        address indexed previousCustomerAddress,
        address indexed newCustomerAddress
    );
    
    /* -- Contract initialization and upgrades -- */
    
    function initialize_v1(
        address roleRegistry
    ) 
        public 
        initializer
    {
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

    modifier onlyRegistrar() {
        roleRegistry().requireRegistrarRole(msg.sender);
        _;
    }
    
    function registerCustomer(
        string calldata customerId,
        address customerAddress
    )
        external
        onlyRegistrar
    {
        require(customerAddress != address(0), 'CustomerRegistry: customer address is the zero address');
        require(_isValidCustomerId(customerId), 'CustomerRegistry: customer id is invalid');
        
        require(_customerAddresses[customerId] == address(0), 'CustomerRegistry: customer id is already taken');
        require(bytes(_customerIds[customerAddress]).length == 0, 'CustomerRegistry: customer address is already taken');
        
        uint256 customerIndex = _customersCount++;

        _customerIds[customerAddress] = customerId;
        _customerAddresses[customerId] = customerAddress;
        _customerIndexes[customerId] = customerIndex;
        _customers[customerIndex] = Customers.Customer(customerAddress, customerId);
        
        emit CustomerRegistered(customerId, customerId, customerAddress);
    }

    function updateCustomer(
        string calldata customerId,
        address newCustomerAddress
    )
        external
        onlyRegistrar
    {
        require(newCustomerAddress != address(0), 'CustomerRegistry: new (updated) customer address is the zero address');
        require(_isValidCustomerId(customerId), 'CustomerRegistry: customer id is invalid');

        address previousCustomerAddress = _customerAddresses[customerId];
        
        require(previousCustomerAddress != address(0), 'CustomerRegistry: customer is not registered');
        
        uint256 customerIndex = _customerIndexes[customerId];

        _customerIds[previousCustomerAddress] = '';
        _customerIds[newCustomerAddress] = customerId;
        _customerAddresses[customerId] = newCustomerAddress;
        _customers[customerIndex].customerAddress = newCustomerAddress;

        emit CustomerUpdated(customerId, customerId, previousCustomerAddress, newCustomerAddress);
    }
    
    function addressOf(
        string calldata customerId
    )
        external view 
        returns (address)
    {
        return _customerAddresses[customerId];
    }

    function customersCount() 
        external view 
        returns (uint256)
    {
        return _customersCount;
    }
    
    function getCustomer(
        uint256 customerIndex
    )
        external view 
        returns (address customerAddress, string memory customerId)
    {
        return (_customers[customerIndex].customerAddress, _customers[customerIndex].customerId);
    }

    function indexOf(
        string calldata customerId
    )
        external view
        returns (uint256)
    {
        return _customerIndexes[customerId];
    }
    
    function idOf(
        address customerAddress
    )
        external view 
        returns (string memory)
    {
        return _customerIds[customerAddress];
    }

    function isCustomer(
        address customerAddress
    )
        public view 
        returns (bool)
    {
        return bytes(_customerIds[customerAddress]).length > 0;
    }
    
    function _isValidCustomerId(
        string memory customerId
    )
        private pure
        returns (bool)
    {
        return bytes(customerId).length == 36;
    }

    uint256[50] private ______gap;
}