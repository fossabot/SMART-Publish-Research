pragma solidity ^0.4.24;

import "./AbstractContributor.sol";

contract Researcher is AbstractContributor {

    function newInstance() external returns(IContributor) {
        return new Researcher();
    }

}