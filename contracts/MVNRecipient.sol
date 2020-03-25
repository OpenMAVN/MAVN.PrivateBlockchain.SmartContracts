pragma solidity 0.5.12;

import '@openzeppelin/upgrades/contracts/Initializable.sol';
import "@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC1820Registry.sol";
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC777/IERC777.sol';
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC777/IERC777Recipient.sol";
import "./MVNToken.sol";

contract MVNRecipient is Initializable, IERC777Recipient {
    MVNToken private _mvn;

    function initialize_v1(
        address mvn,
        address erc1820Registry
    )
        public
        initializer
    {
        require(mvn != address(0), 'MVNRecipient: mvn is the zero address');
        require(erc1820Registry != address(0), 'MVNRecipient: erc1820registry is the zero address');

        IERC1820Registry erc1820 = IERC1820Registry(erc1820Registry);
        erc1820.setInterfaceImplementer(address(this), keccak256('ERC777TokensRecipient'), address(this));

        _mvn = MVNToken(mvn);
    }
    
    modifier onlyMVN() {
        require(msg.sender == address(_mvn), 'MVNRecipient: sender is not mvn token');
        _;
    }

    function mvn()
        public view
        returns (MVNToken)
    {
        return _mvn;
    }
    
    uint256[50] private ______gap;
}
