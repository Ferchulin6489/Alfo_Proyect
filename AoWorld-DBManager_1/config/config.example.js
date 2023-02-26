module.exports = {
    socketPort: process.env.SOCKET_PORT || 1234,
    mysql: { // Mysql        
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "javiersql",
        database: process.env.MYSQL_DATABASE || "ao-new",
        port: process.env.MYSQL_PORT || 3306,
        connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 15
    },
    pool: {
        min: 2,
        max: 15
    }
}