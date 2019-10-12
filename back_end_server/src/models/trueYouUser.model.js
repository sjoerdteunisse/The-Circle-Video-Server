class TrueYouUser {
	// Model die een user beschrijft
        constructor(firstname, prefix, lastname, avatarUrl, description, email, phone, country, dateOfBirth, satoshiBalance, residence, active, publicKey, hashPublicKey, hashUserInfo, digiSig) {
                this.firstname = firstname;
                this.prefix = prefix;
                this.lastname = lastname;
                this.avatarUrl = avatarUrl;
                this.description = description;
                this.email = email;
                this.phone = phone;
                this.country = country;
                this.dateOfBirth = dateOfBirth;
                this.satoshiBalance = satoshiBalance;
                this.residence = residence;
                this.active = active;
                this.publicKey = publicKey;
                this.hashPublicKey = hashPublicKey;
                this.hashUserInfo = hashUserInfo;
                this.digiSig = digiSig;
        }
}

module.exports = TrueYouUser
