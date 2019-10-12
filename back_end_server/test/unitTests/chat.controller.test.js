const chai = require('chai')
const chaiHttp = require('chai-http')
const pool = require('../../src/config/db')
const server = require('../../../webserver')
const sinon = require('sinon');
const assert = require('assert');
const fs = require('fs');
const crypto = require('crypto');
const sandbox = sinon.createSandbox();
chai.should()
chai.use(chaiHttp)
const ioE = require('socket.io-client');


const testUser1 = {
    firstName: 'testTrueYouFirstname',
    lastName: 'testTrueYouLastname',
    description: 'testTrueYouDescription',
    residence: 'testTrueYouResidence',
    country: 'testTrueYouCountry',
    dateOfBirth: '2001-01-01',
    email: 'testTrueYouEmail@seechange.com',
    phoneNumber: '061234567',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBALw0/jCc/VJF7lU17ACN317waRE+\njohNbNpkmkPwrFFg2e0G6574kTyj2KKVhtlLEh3Snnv/mHHrRvOFT2F2+WC+wbD9v8LNGhzN7/6Z\n34vrYPG0m5Vg/GEUW22kdQ8gFUdsF0XdRCqR+SuYaiUxkmx05s111pqgmIlbNcJCnF6bAgMBAAEC\ngYAXYcYKqBZYuFNpxq8xSm7rzpZfDBSNHoFdiI4Zzra5zXyFlAyFzX/NttVdLZJ5QHhZuCb0ZMa9\nsGs6Kd+4zh0hDx3cHx22tyJ1lMxbTf2iQoZcWe5Xr0SMzQzpPa4XQeMQoWJTkisxqPccMxS65XL/\niOxTvdplZuljJ1TOJ4cFQQJBAO0guQMK4lb6af/Gxa2STF6NI43hsX8YRpE2rgnQOSmRrJrsRZKD\nvTciOXbLdEVYkRlZNPo37AB9pyzwWm3gPnECQQDLL4zbhXe7swNBzmo2ibwOGNL78X3VjvTrmkTm\nMDhAREO1eBERABIrFiuZ4ywbRDOmIzz7NO9ayECL+CM23AvLAkA/GSkCDUBjQqk4HY12fWqC8m2W\nkIrptez5MSKoi9baH+BdLSfqL9IGvL2rxcG/viyGIT2+o2jSTJ1SkPaPLE+RAkEAj5aY6oGVrdXC\nFX0z3jrT5PpyD44HqSYPu3gX/LxS5EfZuaKSHPt5220dfvDluJcoEN6SN8ye4f7mboP7DsfOpQJB\nALNuQ8JZr303LgwOFoTIpOIvc4q059TgT36fLYhTedhwMvuZnioCs3itirxvspZ+q8cB6T7dYRZv\nuW/PcAHxc4I=\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8NP4wnP1SRe5VNewAjd9e8GkRPo6ITWzaZJpD\n8KxRYNntBuue+JE8o9iilYbZSxId0p57/5hx60bzhU9hdvlgvsGw/b/CzRocze/+md+L62DxtJuV\nYPxhFFttpHUPIBVHbBdF3UQqkfkrmGolMZJsdObNddaaoJiJWzXCQpxemwIDAQAB\n-----END PUBLIC KEY-----',
    avatarUrl: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
    active: 1
}

const testUser2 = {
    firstName: 'inactiveTestFN',
    lastName: 'inactiveTestLN',
    description: 'inactiveTestD',
    residence: 'inactiveTestR',
    country: 'inactiveTestC',
    dateOfBirth: '2001-02-02',
    email: 'inactiveTestE@seechange.com',
    phoneNumber: '062345678',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAPb5bHHhvPVjtVS8WGOeV/FWb7Do\njGKABR18mnaPkh7000Qx6s8x5h8A35ql8s6ScpenZhXmfsBe7/JujzX+Au6ZfA1DOkFQezJgCqhG\n9yQTeOB35Q1lNwvH58uTfbvlbit8OMrb3fxuIvT4dLUQuHCgis+jomztXHA5I8/qaMexAgMBAAEC\ngYAVndgxkYtbQ7pj1nEQFb8Rxw8ol09uRvvroZ6CwRHjjBSPvqS+34RfnfvJn+Zu0TT0Hs6Zx8kR\nUl3txLfb3HCUwKxzf2BAzqvVuDLS/XVT/BaPN2WiElEeMGbIEnsvI/GxvoUqc+HG3CKZJmGRS1tQ\niQrwTz9o0RNGgAo3LV3khwJBAP9J76Sza6hoVCTG30O+cDpOa1Y0katRmKYcsJNBqttrULHnbcVN\nnQonBg8ikiXAcYwFwRsSnY8ew+2OCxdppn8CQQD3qY7QViLUwYdrQQZQHFX5hwUEjaTtsd2b1yYp\nTeXctmlVYtodTNaGQtnepRB3k0fgaLOZyy+p3kZir5O8Z1nPAkEAnJO4jAgPy+bRVQ00+tPe+aQH\naYQspCsTuS53jpoENTgI8lTDmvQTkZqFuNq3ULhL7FnLKtOsF5ADE7y/SMjf+QJAB/o3NnC/2HiP\nYx4KFQSEpG/78mSZnmpvR/jLKuNudwiNJgn0GqOB+Xsnx2srt55P32Of/WE1HNSjEcS0DoqJswJB\nAN1LVvF64pE2OPBkh9K17HendgtcCS3h0bw7ooepgoNv/I9e3Yth8eOj4K8/GZ/7HNDF9IjqaoLu\nxNvXSVU/pkQ=\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD2+Wxx4bz1Y7VUvFhjnlfxVm+w6IxigAUdfJp2\nj5Ie9NNEMerPMeYfAN+apfLOknKXp2YV5n7AXu/ybo81/gLumXwNQzpBUHsyYAqoRvckE3jgd+UN\nZTcLx+fLk3275W4rfDjK2938biL0+HS1ELhwoIrPo6Js7VxwOSPP6mjHsQIDAQAB\n-----END PUBLIC KEY-----',
    avatarUrl: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
    active: 1
}

describe('Chat API', () => {

    before((done) => {
        const query = "DELETE FROM `chat` WHERE sender_id = (SELECT id FROM trueyouusers WHERE phone = '061234567') OR sender_id = (SELECT id FROM trueyouusers WHERE phone = '062345678')"
        pool.execute(query, (err, rows, fields) => {
            if (err) {
                assert.fail(err);
            } else {
                const query = "DELETE FROM `trueyouusers` WHERE phone = '061234567' OR phone = '062345678'"
                pool.query(query, (err, rows, fields) => {
                    if (err) {
                        assert.fail(err);
                    } else {
                        const query = 'INSERT INTO `trueyouusers` (`firstname`, `lastname`, `description`, `residence`, `country`, `dateOfBirth`, `email`, `phone`, `publicKey`,  `active`, `avatarUrl`) VALUES ?;';
                        const values = [
                            [testUser2.firstName, testUser2.lastName, testUser2.description, testUser2.residence, testUser2.country, testUser2.dateOfBirth, testUser2.email, testUser2.phoneNumber, testUser2.publicKey, testUser2.active, testUser2.avatarUrl],
                            [testUser1.firstName, testUser1.lastName, testUser1.description, testUser1.residence, testUser1.country, testUser1.dateOfBirth, testUser1.email, testUser1.phoneNumber, testUser1.publicKey, testUser1.active, testUser1.avatarUrl]
                        ];
                        pool.query(query, [values], (err, rows, fields) => {
                            if (err) {
                                console.log(err);
                                assert.fail(err + values)
                            } else {
                                done();
                            }
                        })
                    }
                })
            }
        })
    })

    function sign(data, privateKey) {
        const signer = crypto.createSign('RSA-SHA256');
        signer.sign
        signer.update(data)
        signer.end();
        digitalSignature = signer.sign(privateKey)
        return Buffer.from(digitalSignature).toString('base64');
    }

    it('should add a message to the chat for the given streamer', (done) => {
        var message = "test message";
        chai.request(server)
            .post('/chat/message')
            .send({
                'streamerPhone': testUser1.phoneNumber,
                'clientPhone': testUser2.phoneNumber,
                'message': message,
                'digiSig': sign(message, testUser2.privateKey, testUser2.publicKey, false)
            })
            .end((err, res) => {
                res.should.have.status(200);
                done()
            })
    })

    it('should get a collection of chat messages for the given streamer', (done) => {
        chai.request(server)
            .get('/chat/' + testUser1.phoneNumber + "/" + testUser2.phoneNumber)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.an('array').that.has.lengthOf(1)
                res.body[0].should.have.property('msg').that.is.a('string')
                res.body[0].should.have.property('digiSig').that.is.a('string')
                done()
            });
    })

    it('should return 400 when digital signature doesn\'t match', (done) => {
        var message = "test message";
        chai.request(server)
            .post('/chat/message')
            .send({
                'streamerPhone': testUser1.phoneNumber,
                'clientPhone': testUser2.phoneNumber,
                'message': message,
                'digiSig': 'wrongdigisig'
            })
            .end((err, res) => {
                res.should.have.status(400);
                done()
            })
    })

    it('should return 400 when digital signature doesn\'t match', (done) => {
        chai.request(server)
            .get('/chat/wrongphonenumber')
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.have.property('error')
                res.body.error.message.should.equal('Non-existing endpoint')
                done()
            });
    })

    it('should return a viewer count of 1', (done) => {
        var socket = ioE("http://localhost:3000");
        socket.on('viewCount' + testUser1.phoneNumber, function (data) {

            data.count.should.equal('1')
            done()

        })
        socket.on('connect', function (data) {
            console.log("I connected")
            socket.emit('join', testUser1.phoneNumber)
        })
        socket.connect()
    })

    after((done) => {
        const query = "DELETE FROM `chat` WHERE sender_id = (SELECT id FROM trueyouusers WHERE phone = '061234567') OR sender_id = (SELECT id FROM trueyouusers WHERE phone = '062345678')"
        pool.query(query, (err, rows, fields) => {
            if (err) {
                assert.fail(err);
            } else {
                const query = "DELETE FROM `trueyouusers` WHERE phone = '061234567' OR phone = '062345678'"
                pool.query(query, (err, rows, fields) => {
                    if (err) {
                        assert.fail(err);
                    } else {
                        sandbox.restore();
                    }
                    done();
                })
            }
            
        })
    })
});
