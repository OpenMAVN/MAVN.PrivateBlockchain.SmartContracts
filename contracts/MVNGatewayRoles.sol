pragma solidity 0.5.12;

import "./IRoleRegistry.sol";

library MVNGatewayRoles {

    function requireBridgeRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Bridge"),
            "MVNGatewayRoles: caller does not have the Bridge role"
        );
    }

    function requireLinkerRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Linker"),
            "MVNGatewayRoles: caller does not have the Linker role"
        );
    }

    function requireManagerRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Manager"),
            "MVNGatewayRoles: caller does not have the Manager role"
        );
    }

    function requireOwnerRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isOwner(account),
            "MVNGatewayRoles: caller is not the Owner"
        );
    }

}
