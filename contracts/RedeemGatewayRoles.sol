pragma solidity 0.5.12;

import "./IRoleRegistry.sol";

library RedeemGatewayRoles {

    function requireManagerRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Manager"),
            "RedeemGatewayRoles: caller does not have the Manager role"
        );
    }

}
