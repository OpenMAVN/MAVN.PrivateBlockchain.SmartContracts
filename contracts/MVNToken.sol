pragma solidity 0.5.12;

import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC777/ERC777.sol';
import "./MVNTokenRoles.sol";
import "./IHaveVersion.sol";
import "./IRoleRegistry.sol";
import "./RoleRegistryClient.sol";

contract MVNToken is ERC777, RoleRegistryClient, IHaveVersion {
    using SafeMath for uint256;
    using MVNTokenRoles for IRoleRegistry;

    mapping(address => uint256) private _stakes;
    uint256 private _version;

    event FeeCollected(
        address indexed from,
        address indexed to,
        uint256 amount,
        string reason
    );
    
    event SeizeFrom(
        address indexed account,
        uint256 amount,
        string reason
    );
    
    event StakeDecreased(
        address indexed account,
        uint256 releasedAmount,
        uint256 burntAmount
    );
    
    event StakeIncreased(
        address indexed account,
        uint256 amount
    );
    
    /* -- Contract initialization and upgrades -- */
    
    function initialize_v1(
        address erc1820Registry,
        address roleRegistry
    )
        public
        initializer 
    {
        ERC777.initialize("MAVN Utility Token", "MVN", new address[](0), erc1820Registry);
        RoleRegistryClient.initialize_v1(roleRegistry);
        
        _version = 1;
    }

    function version()
        external view 
        returns (uint256)
    {
        return _version;
    }

    /* -- Contract implementation -- */

    modifier onlyFeeCollector() {
        roleRegistry().requireFeeCollectorRole(msg.sender);
        _;
    }

    modifier onlyMinter() {
        roleRegistry().requireMinterRole(msg.sender);
        _;
    }

    modifier onlySeizer() {
        roleRegistry().requireSeizerRole(msg.sender);
        _;
    }

    modifier onlyStaker() {
        roleRegistry().requireStakerRole(msg.sender);
        _;
    }
    
    function burn(
        uint256 amount,
        bytes calldata data
    )
        external
    {
        require(_amountDoesNotExceedNonStakedBalance(msg.sender, amount), "MVNToken: amount exceeds non-staked balance");
    
        _burn(msg.sender, msg.sender, amount, data, "");
    }
    
    function collectFee(
        address from,
        address to,
        uint256 amount,
        string calldata reason
    )
        external
        onlyFeeCollector
    {
        require(from != address(0), "MVNToken: from is the zero address");
        require(to != address(0), "MVNToken: to is the zero address");
        
        _move(msg.sender, from, to, amount, "", "");
        
        emit FeeCollected(from, to, amount, reason);
    }

    function decreaseStake(
        address account,
        uint256 amountToRelease,
        uint256 amountToBurn
    )
        external
        onlyStaker
    {
        uint256 amount = amountToRelease.add(amountToBurn);

        require(account != address(0), "MVNToken: account is the zero address");

        _stakes[account] = _stakes[account].sub(amount);

        if (amountToBurn > 0) {
            
            if (amountToBurn > balanceOf(account)) {
                amountToBurn = balanceOf(account);
            }
            
            _burn(msg.sender, account, amountToBurn, "", "");
        }
    
        emit StakeDecreased(account, amountToRelease, amountToBurn);
    }
    
    function increaseStake(
        address account,
        uint256 amount
    )
        external
        onlyStaker
    {
        require(account != address(0), "MVNToken: account is the zero address");
        
        uint256 newStake = _stakes[account].add(amount);
        
        require(balanceOf(account) >= newStake, "MVNToken: stake exceeds balance");
    
        _stakes[account] = newStake;
        
        emit StakeIncreased(account, amount);
    }
    
    function mint(
        address account,
        uint256 amount
    )
        external
        onlyMinter
    {
        _mint(msg.sender, account, amount, "", "");
    }

    function seizeFrom(
        address account,
        uint256 amount,
        string calldata reason
    )
        external
        onlySeizer
    {
        _burn(msg.sender, account, amount, "", "");
        
        emit SeizeFrom(account, amount, reason);
    }
    
    function stakeOf(
        address account
    )
        external view
        returns (uint256)
    {
        require(account != address(0), "MVNToken: account is the zero address");
        
        return _stakes[account];
    }

    function _move(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    )
        internal
    {
        require(_amountDoesNotExceedNonStakedBalance(from, amount), "MVNToken: amount exceeds non-staked balance");
    
        super._move(operator, from, to, amount, userData, operatorData);
    }
    
    function _amountDoesNotExceedNonStakedBalance(
        address account,
        uint256 amount
    )
        internal view
        returns (bool)
    {
        uint256 balance = balanceOf(account);
        uint256 stake = _stakes[account];
    
        uint256 nonStakedBalance = 0;
        
        if (stake <= balance) {
            nonStakedBalance = balance - stake;
        }
    
        return nonStakedBalance >= amount;
    }
    
    uint256[50] private ______gap;
}
