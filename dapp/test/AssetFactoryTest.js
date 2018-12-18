var truffleAssert = require('truffle-assertions');

var AssetFactory = artifacts.require('AssetFactory');
var PeerReviewWorkflow = artifacts.require('PeerReviewWorkflow');
var Paper = artifacts.require('Paper');
var Contributors = artifacts.require('Contributors');

contract('AssetFactoryTest', function(accounts) {
    var factory, workflow, contributors;
    beforeEach(async function() {
        contributors = await Contributors.new();
        factory = await AssetFactory.new(contributors.address);
        workflow = await PeerReviewWorkflow.new();
    });

    it("should create a new Paper with pre-existing Contributor", async function() {
        await contributors.createContributor("0000-0002-1825-0097",{ from: accounts[0] })
        let tx = await factory.createPaper(
            'Awesome Title paper',
            'Best abstract',
            'IPFS',
            'https://ipfs.io/test',
            'blake2b',
            'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B',
            workflow.address,
            'google-oauth2|129380127374018398127'
        )
        truffleAssert.eventEmitted(tx, 'AssetCreated', null, 'AssetCreated should be emitted')
        truffleAssert.eventNotEmitted(tx, 'ContributorCreated', null, 'ContributorCreated should not be emitted')
    });

    it("should create a new Paper using PeerReviewWorkflow", async function () {
        let tx = await factory.createPaper(
            'Awesome Title paper',
            'Best abstract',
            'IPFS',
            'https://ipfs.io/test',
            'blake2b',
            'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B',
            workflow.address,
            'google-oauth2|129380127374018398127'
        )
        truffleAssert.eventEmitted(tx, 'AssetCreated', function (e) {
            return e.assetAddress !== undefined;
        });
    });


    it("should get properties: title and abstract from a Paper after be submitted", function () {
        var paperAddress, paper;
        return factory.createPaper(
            'Awesome Title paper',
            'Best abstract',
            'IPFS',
            'https://ipfs.io/test',
            'blake2b',
            'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B',
            workflow.address,
            'google-oauth2|129380127374018398127'
        ).then(function (tx) {
            return truffleAssert.eventEmitted(tx, 'AssetCreated', function (e) {
                paperAddress = e.assetAddress;
                return e.assetAddress !== undefined;
            });
        }).then(function() {
            return Paper.at(paperAddress);
        }).then(function (instance) {
            paper = instance;
            return Promise.all([
                paper.title.call(),
                paper.summary.call(),
                paper.getFile.call(0)
            ]);
        }).then(function (values) {
            assert.strictEqual(values[0],'Awesome Title paper','Titles are different');
            assert.strictEqual(values[1],'Best abstract','Abstracts are different');
            assert.strictEqual(values[2][0],'IPFS','File System Names are different');
            assert.strictEqual(values[2][1],'https://ipfs.io/test','Public locations are different');
            assert.strictEqual(values[2][2],'blake2b','Summary Hash Algorithms are different');
            assert.strictEqual(values[2][3],'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B','Summary Hashes are different');
        });
    });

});