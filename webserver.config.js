const rtspWebServerListnerIP = '145.49.46.62'
const rtspWebServerListnerPort = 8080;
const webServerPort = 3000;

const integrityHost = '145.49.46.62';
const integrityPort = 27005;

const dbconfig = {
	host: process.env.DB_HOST || '188.166.28.126',
	user: process.env.DB_USER || 'trueyou',
	password: process.env.DB_PASSWORD || '(TrueYou)',
	database: process.env.DB_DATABASE || 'thecircledb',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
}

module.exports = {
    rtspWebServerListnerIP,
    rtspWebServerListnerPort,
    webServerPort,
    dbconfig,
    integrityHost,
    integrityPort
}
