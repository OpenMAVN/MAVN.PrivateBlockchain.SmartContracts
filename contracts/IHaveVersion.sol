pragma solidity 0.5.12;

interface IHaveVersion {
    
    function version() 
        external view
        returns (uint256);
    
}
