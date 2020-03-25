pragma solidity 0.5.12;

interface IRoleRegistry {

    function isInRole(
        address resource,
        address account,
        string calldata role
    )
        external view
        returns (bool);

    function isOwner(
        address account
    ) 
        external view
        returns (bool);

}
