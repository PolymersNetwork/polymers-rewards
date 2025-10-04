const { ethers } = require("hardhat");

async function main() {
  const WrappedEsgNFT = await ethers.getContractFactory("WrappedEsgNFT");
  const contract = await WrappedEsgNFT.deploy(process.env.ETHEREUM_WORMHOLE);
  await contract.deployed();
  console.log("WrappedEsgNFT deployed to:", contract.address);
}

main();
