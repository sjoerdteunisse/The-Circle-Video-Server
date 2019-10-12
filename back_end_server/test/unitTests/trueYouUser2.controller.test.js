const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../../../webserver')
const pool = require('../../src/config/db')
const assert = require('assert');
const crypto = require('crypto');
const keysOfServer = require('../../src/config/key');

chai.should()
chai.expect()
chai.use(chaiHttp)

let user = {
    firstName: 'firstname',
    lastName: 'lastname',
    avatarUrl: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
    description: 'testTrueYouDescription',
    residence: 'testTrueYouResidence',
    country: 'testTrueYouCountry',
    dateOfBirth: '2001-01-01',
    email: 'YouEmail@seechange.com',
    satoshiBalance: 15.00,
    phoneNumber: '067654321',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBALw0/jCc/VJF7lU17ACN317waRE+\njohNbNpkmkPwrFFg2e0G6574kTyj2KKVhtlLEh3Snnv/mHHrRvOFT2F2+WC+wbD9v8LNGhzN7/6Z\n34vrYPG0m5Vg/GEUW22kdQ8gFUdsF0XdRCqR+SuYaiUxkmx05s111pqgmIlbNcJCnF6bAgMBAAEC\ngYAXYcYKqBZYuFNpxq8xSm7rzpZfDBSNHoFdiI4Zzra5zXyFlAyFzX/NttVdLZJ5QHhZuCb0ZMa9\nsGs6Kd+4zh0hDx3cHx22tyJ1lMxbTf2iQoZcWe5Xr0SMzQzpPa4XQeMQoWJTkisxqPccMxS65XL/\niOxTvdplZuljJ1TOJ4cFQQJBAO0guQMK4lb6af/Gxa2STF6NI43hsX8YRpE2rgnQOSmRrJrsRZKD\nvTciOXbLdEVYkRlZNPo37AB9pyzwWm3gPnECQQDLL4zbhXe7swNBzmo2ibwOGNL78X3VjvTrmkTm\nMDhAREO1eBERABIrFiuZ4ywbRDOmIzz7NO9ayECL+CM23AvLAkA/GSkCDUBjQqk4HY12fWqC8m2W\nkIrptez5MSKoi9baH+BdLSfqL9IGvL2rxcG/viyGIT2+o2jSTJ1SkPaPLE+RAkEAj5aY6oGVrdXC\nFX0z3jrT5PpyD44HqSYPu3gX/LxS5EfZuaKSHPt5220dfvDluJcoEN6SN8ye4f7mboP7DsfOpQJB\nALNuQ8JZr303LgwOFoTIpOIvc4q059TgT36fLYhTedhwMvuZnioCs3itirxvspZ+q8cB6T7dYRZv\nuW/PcAHxc4I=\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8NP4wnP1SRe5VNewAjd9e8GkRPo6ITWzaZJpD\n8KxRYNntBuue+JE8o9iilYbZSxId0p57/5hx60bzhU9hdvlgvsGw/b/CzRocze/+md+L62DxtJuV\nYPxhFFttpHUPIBVHbBdF3UQqkfkrmGolMZJsdObNddaaoJiJWzXCQpxemwIDAQAB\n-----END PUBLIC KEY-----'
}

before((done) => {
    // Verwijder alle voorgaande data uit de tabel
    const delTrueYouUsers = 'DELETE FROM `trueyouusers` WHERE phone = ?';
    pool.query(delTrueYouUsers, [user.phoneNumber], (err, rows, fields) => {
        if (err) {
            assert.fail(err)
        }

        const insertUserQuery = "INSERT INTO `trueyouusers` (`firstname`, `lastname`, `avatarUrl`, `email`, `phone`, `country`, `dateOfBirth`, `satoshiBalance`, `residence`, `active`, `publicKey`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        pool.query(insertUserQuery, [user.firstName, user.lastName, user.avatarUrl, user.email, user.phoneNumber, user.country, user.dateOfBirth, user.satoshiBalance, user.residence, 1, user.publicKey], (err, rows, fields) => {
            if (err) {
                assert.fail(err)
            } else {
                done();
            }
        })
    });
})

// Test if avatar can be edited
it('should return 200 when avatar is not too big', (done) => {
    
    const sign = crypto.createSign('SHA256');
    sign.write(user.avatarUrl);
    sign.end();
    const signature = sign.sign(user.privateKey, 'base64');

    chai.request(server)
        .post(`/api/User/NewAvatar`)
        .send({
            "avatarAsBase64": user.avatarUrl,
            "phoneNumber": user.phoneNumber,
            "pubKey": user.publicKey,
            "digiSigAvatar": signature
        })
        .end((err, res) => {
            res.text.should.equal('{"status":"ok"}');
            res.should.have.status(200)
            done()
        })
})

// Test if satoshibalance can be retrieved
it('should return 200 when satoshibalance can be retrieved', (done) => {
    chai.request(server)
        .get('/api/User/Satoshibalance/' + user.phoneNumber)
        .send()
        .end((err, res) => {
            var verifier = crypto.createVerify('RSA-SHA256')
            verifier.update(res.body.result.satoshiBalance, 'utf8')

			// Verify
            const integrityCheck = verifier.verify(keysOfServer.publicKeyServer, res.body.result.digSignature, 'base64')
            
            integrityCheck.should.be.true;
            res.should.have.status(200)
            done()
        })
})