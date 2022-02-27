import mysql from 'mysql2'

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'news'
})

// 默认导出一个支持 Promise API 的 pool
export default pool.promise()