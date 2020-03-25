pragma solidity 0.5.12;

library Transfers {
    
    struct Transfer {
        bool accepted;
        uint256 amount;
        uint256 number;
        bool received;
        bool rejected;
        address sender;
    }

    function isAccepted(
        mapping(bytes => Transfer) storage transfers,
        bytes memory internalTransferId
    )
        internal view
        returns (bool)
    {
        return transfers[internalTransferId].accepted;
    }

    function isReceived(
        mapping(bytes => Transfer) storage transfers,
        bytes memory internalTransferId
    )
        internal view
        returns (bool)
    {
        return transfers[internalTransferId].received;
    }

    function isRejected(
        mapping(bytes => Transfer) storage transfers,
        bytes memory internalTransferId
    )
        internal view
        returns (bool)
    {
        return transfers[internalTransferId].rejected;
    }
    
}
