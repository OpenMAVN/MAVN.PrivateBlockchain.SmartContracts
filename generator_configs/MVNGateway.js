module.exports = {

    functions: [
        "linkPublicAccount",
        "setTransferToPublicNetworkFee",
        "transferFromPublicNetwork",
        "transferToPublicNetworkFee",
        "unlinkPublicAccount"
    ],

    events: [
        "PublicAccountLinked",
        "PublicAccountUnlinked",
        "TransferredFromPublicNetwork",
        "TransferredToPublicNetwork",
        "TransferToPublicNetworkFeeSet"
    ]
};