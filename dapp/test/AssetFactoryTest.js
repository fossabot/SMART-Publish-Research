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
        await contributors.createContributor("0000-0002-1825-0097",{ from: accounts[1] })
        let tx = await factory.createPaper(
            'Awesome Title paper',
            'Best abstract',
            'IPFS',
            'https://ipfs.io/test',
            'blake2b',
            'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B',
            workflow.address,
            '0000-0002-1825-0097',
            { from: accounts[1] }
        )
        let paperAddress;
        truffleAssert.eventEmitted(tx, 'AssetCreated', function(e) {
            paperAddress = e.assetAddress;
            return e.assetAddress !== undefined;
        }, 'AssetCreated should be emitted')
        truffleAssert.eventNotEmitted(tx, 'ContributorCreated', null, 'ContributorCreated should not be emitted')
        let paper = await Paper.at(paperAddress)
        let owner = await paper.owner.call()
        assert.strictEqual(owner, accounts[1], 'Paper owner should be match')
    });

    it("should create a new Paper using PeerReviewWorkflow", async function() {
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
        truffleAssert.eventEmitted(tx, 'AssetCreated');
    });


    it("should get properties: title and abstract from a Paper after be submitted", async function() {
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
        let paperAddress;
        truffleAssert.eventEmitted(tx, 'AssetCreated', function (e) {
            paperAddress = e.assetAddress;
            return e.assetAddress !== undefined;
        });

        let paper = await Paper.at(paperAddress)
        let title = await paper.title.call()
        assert.strictEqual(title,'Awesome Title paper','Titles are different');
        
        let summary = await paper.summary.call()
        assert.strictEqual(summary,'Best abstract','Abstracts are different');
        
        let file = await paper.getFile(0)
        assert.strictEqual(file[0],'IPFS','File System Names are different');
        assert.strictEqual(file[1],'https://ipfs.io/test','Public locations are different');
        assert.strictEqual(file[2],'blake2b','Summary Hash Algorithms are different');
        assert.strictEqual(file[3],'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B','Summary Hashes are different');
    });

    it("should get contributor: Author from Paper after be submitted", async function() {
        let tx = await factory.createPaper(
            'Awesome Title paper',
            'Best abstract',
            'IPFS',
            'https://ipfs.io/test',
            'blake2b',
            'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B',
            workflow.address,
            'google-oauth2|129380127374018398127',
            { from: accounts[1] }
        )
        let paperAddress;
        truffleAssert.eventEmitted(tx, 'AssetCreated', function (e) {
            paperAddress = e.assetAddress;
            return e.assetAddress !== undefined;
        });

        let paper = await Paper.at(paperAddress)
        let contributorsArray = await paper.getContributors.call()
        let contributor_address = await contributors.getOrCreateContributor.call(accounts[1],'google-oauth2|129380127374018398127')
        assert.strictEqual(contributorsArray.length, 1, 'Contributor author should be the only set')
        assert.strictEqual(contributorsArray[0],contributor_address,'Contributor should be match')
    });

});