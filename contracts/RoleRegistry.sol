pragma solidity 0.5.12;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Roles.sol";
import '@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol';
import "./IHaveVersion.sol";
import "./IRoleRegistry.sol";

contract RoleRegistry is Ownable, IRoleRegistry, IHaveVersion {
    using Roles for Roles.Role;
    
    mapping(address => mapping(string => Roles.Role)) private _roles;
    uint256 private _version;

    event RoleAdded(
        address indexed resource,
        address indexed account,
        string role
    );

    event RoleRemoved(
        address indexed resource,
        address indexed account,
        string role
    );

    /* -- Contract initialization and upgrades -- */

    function initialize_v1(
        address owner
    )
        public
        initializer
    {
        require(owner != address(0), "RoleRegistry: owner is the zero address");
        
        Ownable.initialize(owner);

        _version = 1;
    }

    function version()
        external view
        returns (uint256)
    {
        return _version;
    }
    
    /* -- Contract implementation -- */

    function addRole(
        address resource,
        address account,
        string calldata role
    )
        external
        onlyOwner
    {
        _addRole(resource, account, role);
    }

    function removeRole(
        address resource,
        address account,
        string calldata role
    )
        external
        onlyOwner
    {
        _removeRole(resource, account, role);
    }
    
    function renounceRole(
        address resource,
        string calldata role
    )
        external
    {
        _removeRole(resource, msg.sender, role);
    }
    
    function isInRole(
        address resource,
        address account,
        string calldata role
    )
        external view
        returns (bool)
    {
        require(resource != address(0), "RoleRegistry: resource is the zero address");
        require(_roleIsValid(role), "RoleRegistry: role is invalid");
        
        return _roles[resource][role].has(account);
    }

    function isOwner(
        address account
    )
        external view
        returns (bool)
    {
        require(account != address(0), "RoleRegistry: account is the zero address");
        
        return account == owner();
    }

    /**
     * @dev Prevents ownership renouncing.
     */
    function renounceOwnership()
        public
    {
        revert("RoleRegistry: ownership can not be renounced");
    }
    
    function _addRole(
        address resource,
        address account,
        string memory role
    )
        internal
    {
        require(resource != address(0), "RoleRegistry: resource is the zero address");
        require(_roleIsValid(role), "RoleRegistry: role is invalid");
        
        _roles[resource][role].add(account);
        emit RoleAdded(resource, account, role);
    }
    
    function _removeRole(
        address resource,
        address account,
        string memory role
    )
        internal
    {
        require(resource != address(0), "RoleRegistry: resource is the zero address");
        require(_roleIsValid(role), "RoleRegistry: role is invalid");
        
        _roles[resource][role].remove(account);
        emit RoleRemoved(resource, account, role);
    }

    function _roleIsValid(
        string memory role
    )
        private pure
        returns (bool)
    {
        uint256 roleLength = bytes(role).length;
        
        return roleLength >= 1 && roleLength <= 32;
    }

    uint256[50] private ______gap;
}
