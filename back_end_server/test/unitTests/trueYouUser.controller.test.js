const chai = require('chai')
const chaiHttp = require('chai-http')
const pool = require('../../src/config/db')
const server = require('../../../webserver')
const sinon = require('sinon');
const assert = require('assert');
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');
const crypto = require('crypto');

const sandbox = sinon.createSandbox();
// var bitmap = fs.readFileSync("./back_end_server/images/avatar1.png");
var digitalSignature = new ArrayBuffer(50);
chai.should()
chai.use(chaiHttp)

var testUser1 = {
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
    hashPublicKey: '3065048b5aedbcb5ae73a585ba1330fcb5c8d1faa8b6c14b6118d2adfe34719b',
    hashUserInfo: 'abf8aab924b0ebffe4abb258fe0d8fb6c62f112f549ba9a2becb009135fdcf3c',
    allUserInfo: 'testTrueYouFirstnametestTrueYouLastnametestTrueYouDescription061234567testTrueYouEmail@seechange.comtestTrueYouCountry2001-01-01testTrueYouResidence',
    userInfoDigiSig: '',//'a+ao6eiNxVDRD46m2UKjBYqHrHteUkQLU7+zBfuu/NG3QKn7yQVSOZrOMoeGqAI0YCp0LE9fPzI3\ntTFOvav3LZ60ZkvQsMOzeYDnDQgiHRgSBlc2cSzILHUEgDXc2RXFaKCXdkky2E8mQCfs9Nrm+lid\nJAPAR3pCnKSFXo5t6fo=',
    phoneNumberDigiSig: ''
}

var testUser2 = {
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
    hashPublicKey: 'e2207c9e7eb0439be231fbb5d7edae799de605249a605060e062980953a2f681',
    hashUserInfo: 'e055b34c08d4b61d1144849c05b3fbe9fae170d7cbd17bc87a8c4c752ad2ed29',
    allUserInfo: 'inactiveTestFNinactiveTestLNinactiveTestD062345678inactiveTestE@seechange.cominactiveTestC2001-02-02inactiveTestR',
    userInfoDigiSig: '',//'RQ7ZZxAR8DvJYdL6wzbWtimOtCscAwVCZCWycAfVVz8o1z7JMWGypJwYxRmp7GDdhRKCV6tsusqn\n1OZINJCH8H4tK+VaB7+jyAbN0lxJ24A99BoheoKkZzismzUeDSckDaHWA0BWER786vt50FJeusfu\nu5VLO9SvpZO8QsqMsHE=\n',
    phoneNumberDigiSig: '',
    active: 1,
    avatarUrl: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
}


describe('TrueYou API', () => {
    before((done) => {
        const query = 'DELETE FROM `trueyouusers` WHERE firstname = "testTrueYouFirstname" OR firstname = "inactiveTestFN"'
        pool.query(query, (err, rows, fields) => {
            if (err) {
                assert.fail(err);
            } else {
                const query = 'INSERT INTO `trueyouusers` (`firstname`, `lastname`, `description`, `residence`, `country`, `dateOfBirth`, `email`, `phone`, `publicKey`, `active`, `avatarUrl`) VALUES (? ,?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                const values = [testUser2.firstName, testUser2.lastName, testUser2.description, testUser2.residence, testUser2.country, testUser2.dateOfBirth, testUser2.email, testUser2.phoneNumber, testUser2.publicKey, testUser2.active, testUser2.avatarUrl]

                pool.query(query, values, (err, rows, fields) => {
                    if (err) {
                        console.log(err);
                        assert.fail(err + values)
                    } else {
                        // Signatures needed for tests

                        // Userinfo
                        testUser1.userInfoDigiSig = sign(testUser1.allUserInfo, testUser1.privateKey)
                        testUser2.userInfoDigiSig = sign(testUser2.allUserInfo, testUser2.privateKey)

                        // Phonenumbers
                        testUser1.phoneNumberDigiSig = sign(testUser1.phoneNumber, testUser1.privateKey)
                        testUser2.phoneNumberDigiSig = sign(testUser2.phoneNumber, testUser2.privateKey)
                        done();
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

    // Register Test Pass
    it('should return 200 succes when registering correctly', (done) => {
        const sign = crypto.createSign('SHA256');
        sign.write(testUser1.firstName + testUser1.lastName + testUser1.phoneNumber + testUser1.email + testUser1.country + testUser1.dateOfBirth + testUser1.residence + testUser1.publicKey);
        sign.end();
        const signature = sign.sign(testUser1.privateKey, 'base64');

        chai.request(server)
            .post(`/api/User/Register`)
            .send({
                'firstname': testUser1.firstName,
                'lastname': testUser1.lastName,
                'email': testUser1.email,
                'residence': testUser1.residence,
                'country': testUser1.country,
                'dateOfBirth': testUser1.dateOfBirth,
                'phone': testUser1.phoneNumber,
                'publicKey': testUser1.publicKey,
                'digiSig': signature
            })
            .end((err, res) => {
                res.should.have.status(200)
                done()
            })
    })

    // Register Test Fail Integrity
    it('should return 400 when integrity is violated', (done) => {
        chai.request(server)
            .post(`/api/User/Register`)
            .send({
                'firstname': testUser1.firstName,
                'lastname': testUser1.lastName,
                'description': testUser1.description,
                'residence': testUser1.residence,
                'country': testUser1.country,
                'dateOfBirth': testUser1.dateOfBirth,
                'email': testUser1.email,
                'phone': testUser1.phoneNumber,
                'publicKey': testUser1.publicKey,
                'hashPublicKey': 'wrongHash',
                'hashUserInfo': "wrongHash",
                'digiSig': "wrongDigiSig"

            })
            .end((err, res) => {
                res.should.have.status(400)
                done()
            })
    })

    // Register Test Fail data missing
    it('should return 400 when data is missing', (done) => {
        chai.request(server)
            .post(`/api/User/Register`)
            .send({
                'firstname': testUser1.firstName,
                'lastname': testUser1.lastName,
                'description': testUser1.description,
                'country': testUser1.country,
                'dateOfBirth': testUser1.dateOfBirth,
                'email': testUser1.email,
                'phone': testUser1.phoneNumber,
                'publicKey': "1",
                'hashPublicKey': 'hello',
                'hashUserInfo': testUser1.hashUserInfo,

            })
            .end((err, res) => {
                res.should.have.status(400)
                done()
            })
    })

    // Auth test pass
    it('should return 200 when account is active', (done) => {
        chai.request(server)
            .post(`/api/Auth`)
            .send({
                'phoneNumber': testUser2.phoneNumber,
                'digitalSignature': testUser2.phoneNumberDigiSig
            })
            .end((err, res) => {
                res.should.have.status(200)
                done()
            })
    })

    // Auth test fail integrity
    it('should return 400 when integrity is violated', (done) => {
        chai.request(server)
            .post(`/api/Auth`)
            .send({
                'phoneNumber': testUser2.phoneNumber,
                'digitalSignature': "WrongSignature"
            })
            .end((err, res) => {
                res.should.have.status(400)
                done()
            })
    })

    // Auth test fail inactive
    it('should return 400 when account is inactive', (done) => {
        chai.request(server)
            .post(`/api/Auth`)
            .send({
                'phoneNumber': testUser1.phoneNumber,
                'digitalSignature': testUser1.phoneNumberDigiSig
            })
            .end((err, res) => {
                res.should.have.status(400)
                done()
            })
    })

    // after(() => {
    //     const query = 'DELETE FROM `trueyouusers` WHERE firstname = "testTrueYouFirstname" OR firstname = "inactiveTestFN"'
    //     pool.query(query, (err, rows, fields) => {
    //         if (err) {
    //             assert.fail(err);
    //         } else {
    //             sandbox.restore();
    //         }
    //     })
    // })
})