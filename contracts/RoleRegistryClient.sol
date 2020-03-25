pragma solidity 0.5.12;

import '@openzeppelin/upgrades/contracts/Initializable.sol';
import "./IRoleRegistry.sol";

contract RoleRegistryClient is Initializable {
    IRoleRegistry private _roleRegistry;

    function initialize_v1(
        address roleRegistry
    )
        public
        initializer
    {
        require(roleRegistry != address(0), 'RoleRegistryClient: roleRegistry is the zero address');

        _roleRegistry = IRoleRegistry(roleRegistry);
    }
    
    function roleRegistry()
        public view
        returns (IRoleRegistry)
    {
        return _roleRegistry;
    }
}
