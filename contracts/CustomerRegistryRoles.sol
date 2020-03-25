pragma solidity 0.5.12;

import "./IRoleRegistry.sol";

library CustomerRegistryRoles {

    function requireRegistrarRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Registrar"),
            "CustomerRegistryRoles: caller does not have the Registrar role"
        );
    }
    
}
