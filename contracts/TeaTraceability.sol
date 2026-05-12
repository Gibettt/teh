// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TeaTraceability is Ownable {
    struct BatchHeader {
        string batchCode;
        string teaType;
        uint256 createdAt;
        bool exists;
    }

    struct StageRecord {
        string stageName;
        string ipfsCid;
        uint256 timestamp;
        address actor;
    }

    mapping(string => BatchHeader) private batchHeaders;
    mapping(string => StageRecord[]) private batchHistories;

    event BatchCreated(string indexed batchCode, string teaType, uint256 createdAt, address indexed actor);
    event StageAppended(string indexed batchCode, string indexed stageName, string ipfsCid, uint256 timestamp, address indexed actor);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createBatch(string memory batchCode, string memory teaType) external onlyOwner {
        require(!batchHeaders[batchCode].exists, "Batch already exists");

        batchHeaders[batchCode] = BatchHeader({
            batchCode: batchCode,
            teaType: teaType,
            createdAt: block.timestamp,
            exists: true
        });

        emit BatchCreated(batchCode, teaType, block.timestamp, msg.sender);
    }

    function appendStage(
        string memory batchCode,
        string memory stageName,
        string memory ipfsCid
    ) external onlyOwner {
        require(batchHeaders[batchCode].exists, "Batch not found");
        require(bytes(ipfsCid).length > 0, "CID required");

        batchHistories[batchCode].push(
            StageRecord({
                stageName: stageName,
                ipfsCid: ipfsCid,
                timestamp: block.timestamp,
                actor: msg.sender
            })
        );

        emit StageAppended(batchCode, stageName, ipfsCid, block.timestamp, msg.sender);
    }

    function getBatchHeader(string memory batchCode) external view returns (BatchHeader memory) {
        require(batchHeaders[batchCode].exists, "Batch not found");
        return batchHeaders[batchCode];
    }

    function getBatchStages(string memory batchCode) external view returns (StageRecord[] memory) {
        require(batchHeaders[batchCode].exists, "Batch not found");
        return batchHistories[batchCode];
    }
}
