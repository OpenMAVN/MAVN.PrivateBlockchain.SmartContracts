pragma solidity 0.5.12;

import "./IRoleRegistry.sol";

library MVNTokenRoles {

    function requireFeeCollectorRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "FeeCollector"),
            "MVNTokenRoles: caller does not have the FeeCollector role"
        );
    }

    function requireMinterRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Minter"),
            "MVNTokenRoles: caller does not have the Minter role"
        );
    }

    function requireSeizerRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Seizer"),
            "MVNTokenRoles: caller does not have the Seizer role"
        );
    }

    function requireStakerRole(
        IRoleRegistry rolesRegistry,
        address account
    )
        public view
    {
        require(
            rolesRegistry.isInRole(address(this), account, "Staker"),
            "MVNTokenRoles: caller does not have the Staker role"
        );
    }
}
