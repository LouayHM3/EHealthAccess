// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EHealthAccess {
    enum Role { PA, PF, HP, HI, IN, RE, TS, LS }
    enum DataCategory { PID, MD, AFD }
    enum AccessLevel { V, VConst, VConf, Pseudo, Gen, Aggr, Suppr }

    mapping(address => Role) public roles;
    mapping(bytes32 => bool) public consent;
    event AccessLogged(address indexed requester, Role role, string patientId, DataCategory category, AccessLevel decision, bool granted);

    constructor() { roles[msg.sender] = Role.PA; }
    function registerRole(address account, Role role) external { roles[account] = role; }
    function setConsent(string calldata patientId, address requester, bool allowed) external { consent[keccak256(abi.encode(patientId, requester))] = allowed; }

    function requestAccess(string calldata patientId, DataCategory category, uint8 attribute) external returns (AccessLevel decision, bool granted) {
        Role role = roles[msg.sender];
        decision = AccessLevel.Suppr;
        if (role == Role.PA) decision = AccessLevel.V;
        else if (role == Role.PF) decision = consent[keccak256(abi.encode(patientId, msg.sender))] ? AccessLevel.VConst : AccessLevel.Suppr;
        else if (role == Role.LS) decision = AccessLevel.VConf;
        else if (category == DataCategory.PID && attribute == 0 && (role == Role.HP || role == Role.HI || role == Role.RE || role == Role.TS)) decision = AccessLevel.Pseudo;
        else if (category == DataCategory.PID && attribute == 1) decision = AccessLevel.Gen;
        else if (category == DataCategory.MD && (role == Role.HP || role == Role.HI)) decision = AccessLevel.V;
        else if (category == DataCategory.MD && role == Role.RE) decision = AccessLevel.Aggr;
        granted = decision != AccessLevel.Suppr;
        emit AccessLogged(msg.sender, role, patientId, category, decision, granted);
    }
}
