const fcl = require("@onflow/fcl");

fcl.config({
  "app.detail.title": "Trustified", // this adds a custom name to our wallet
  "app.detail.icon": "https://firebasestorage.googleapis.com/v0/b/trustified-flow.appspot.com/o/logo.png?alt=media&token=7aed5361-719d-4bde-8b42-1270c2d71c06", // this adds a custom image to our wallet
  "accessNode.api": process.env.REACT_APP_ACCESS_NODE, // this is for the local emulator
  "discovery.wallet": process.env.REACT_APP_WALLET, // this is for the local dev wallet
  "0xDeployer": process.env.REACT_APP_CONTRACT_ADDRESS, // this auto configures `0xDeployer` to be replaced by the address in txs and scripts
  "0xStandard": process.env.REACT_APP_STANDARD_ADDRESS
})
 