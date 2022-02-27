// orm依赖于第三方mysql模块
const mysql = require('mysql');
// 数据库连接设置
let orm_config = {
    host: 'localhost',//数据库地址
    port:'3306',
    user: 'root',//用户名，没有可不填
    password: 'root',//密码，没有可不填
    database: 'news'//数据库名称
}

let options = {};
let tableSQL = '';
// 这里未采用连接池的方式连接数据库，而是以单个连接的方式，即 connection = mysql.createConnection(options);
// 通过观察第三方mysql模块的源代码可以知道，connection 有以下几个状态：state: 'connected' | 'authenticated' | 'disconnected' | 'protocol_error' | string;
// 如果在执行代码时，报 Error: Cannot enqueue Handshake after already enqueuing a Handshake  
// 则可能与connection已处于connected或authenticated状态下，还建立连接有关
// 需要注意在connection已处于connected或authenticated状态下时，而 isConnect依旧为false
let isConnect = false;

function Model(name, option) {
    this.name = name;
    this.option = option;
};

/**
* @description: 查询数据
* @param {} options：可选参数
* @param {Function} callback :（req,results）=>{}
*/
Model.prototype.find = function (options, callback) {
    // console.log(connection.state);
    // console.log(connection.state === 'authenticated');
    // isConnect = connection.state === 'connected' ? true : false;
    // console.log('isConnect:', isConnect);
    if (!isConnect) {
        console.log(options.constructor);
        this.connect(err => {
            isConnect = true;
            var str = '';
            if (!callback) {
                str = `select * from ${this.name}`;
                callback = options;
            }else if (options.constructor == Array) {
                str = `select ${options.join()} from ${this.name}`;
            }else if(options.constructor == Object){
                str = `select ${options.arr.join()} from ${this.name} where ${options.where}`;
            }else {
                str = `select * from ${this.name} where ${options}`;
            };
            console.log(str);
            connection.query(str, (error, results, fields) => {
                callback(error, results, fields);
            });
            // console.log(this);
            return this;
        })
    } else {
        
        var str = '';
        if (!callback) {
            str = `select * from ${this.name}`;
            callback = options;
        }else if (options.constructor == Array) {
            str = `select ${options.join()} from ${this.name}`;
        }else if(options.constructor == Object){
            str = `select ${options.arr.join()} from ${this.name} where ${options.where}`;
        }else {
            str = `select * from ${this.name} where ${options}`;
        };
        console.log(str);
        // console.log(connection.state);
        connection.query(str, (error, results, fields) => {
            callback(error, results, fields);
        });
        // console.log(this);
        return this;
    }

};

/**
* @description: 分页查询
* @param {Object} options :   { where:查询条件, number: 当前页数 , count : 每页数量 }
* @return: 
*/
Model.prototype.limit = function (options, callback) {
    var str = '';
    if (!options.where) {
        str = `select * from ${this.name} limit ${(options.number - 1) * options.count},${options.count}`;
    } else {
        str = str = `select * from ${this.name} where ${options.where} limit ${(options.number - 1) * options.count},${options.count}`;
    };
    console.log(str);
    connection.query(str, (error, results, fields) => {
        callback(error, results, fields);
    });
    return this;
};

/**
* @description: 插入数据
* @param {Object} obj:对象或者数组
* @param {Function} callback :（req,results）=>{}
*/
Model.prototype.insert = function (obj, callback) {
    // isConnect = connection.state === 'connected' ? true : false;
    if (!isConnect) {
        this.connect(err => {
            isConnect = true;
            if (err) {
                throw err;
            } else {
                connection.query(tableSQL, (error, results, fields) => {
                    if (Array.isArray(obj)) {
                        j = obj.length - 1;
                        for (var i = 0; i < obj.length; i++) {
                            // this.insertObj(obj[i], callback) // 插入多条数据时，可能只需要调用一次callback
                            if(i != j)
                                this.insertObj(obj[i], null)
                            else
                                this.insertObj(obj[i], callback)
                        }
                    } else {
                        this.insertObj(obj, callback)
                    }
                });

            }
        });
    } else {
        if (Array.isArray(obj)) {
            j = obj.length - 1;
            for (var i = 0; i < obj.length; i++) {
                // this.insertObj(obj[i], callback) // 插入多条数据时，可能只需要调用一次callback
                if(i != j)
                    this.insertObj(obj[i], null)
                else
                    this.insertObj(obj[i], callback)
            }
        } else {
            this.insertObj(obj, callback)
        }
    }

};

Model.prototype.insertObj = function (obj, callback) {
    let keys = [];
    let values = '';
    for (var key in obj) {
        keys.push(key);
        values += `"${obj[key]}",`;
    };
    values = values.replace(/,$/, '');
    let str = `INSERT INTO ${this.name} (${keys.join()}) VALUES (${values})`;
    connection.query(str, (error, results, fields) => {
        callback && callback(error, results);
    });
}

/**
* @description: 更新数据
* @param {Object} option：可选参数 更新条件
* @param {Object} obj： 修改后的数据 
* @param {Function} callback :（req,results）=>{}
*/
Model.prototype.update = function (option, obj, callback) {
    if (!isConnect) {
        this.connect(err => {
            isConnect = true;
            let str = '';
            if (arguments.length == 2) {
                callback = obj;
                obj = option;
                str = `UPDATE ${this.name} SET `;
                for (var key in obj) {
                    str += `${key}='${obj[key]}', `;
                };
                str = str.replace(/(, )$/, '');
            } else {
                str = `UPDATE ${this.name} SET `;
                for (var key in obj) {
                    str += `${key}='${obj[key]}', `;
                };
                str = str.replace(/(, )$/, '');
                str += ` where ${option}`;
            };

            console.log(str);
            connection.query(str, (error, results, fields) => {
                callback(error, results, fields);
            });
            return this;
        });
    } else {
        let str = '';
        if (arguments.length == 2) {
            callback = obj;
            obj = option;
            str = `UPDATE ${this.name} SET `;
            for (var key in obj) {
                str += `${key}='${obj[key]}', `;
            };
            str = str.replace(/(, )$/, '');
        } else {
            str = `UPDATE ${this.name} SET `;
            for (var key in obj) {
                str += `${key}='${obj[key]}', `;
            };
            str = str.replace(/(, )$/, '');
            str += ` where ${option}`;
        };

        console.log(str);
        connection.query(str, (error, results, fields) => {
            callback(error, results, fields);
        });
        return this;
    }
};

/**
* @description: 删除数据
* @param {Object} option：可选参数 删除条件
* @param {Function} callback :（req,results）=>{}
*/
Model.prototype.delete = function (option, callback) {
    if(!isConnect){
        this.connect(err => {
            isConnect = true;
            if (err) {
                throw err;
            } else {
                if (!callback) {
                    str = `delete from ${this.name}`;
                    callback = option;
                } else {
                    str = `delete from ${this.name} where ${option}`;
                };
                console.log(str);
                connection.query(str, (error, results, fields) => {
                    callback(error, results, fields);
                });
                return this;
            }
        });
    }else{
        console.log('-----');
        var str = '';
        if (!callback) {
            str = `delete from ${this.name}`;
            callback = option;
        } else {
            str = `delete from ${this.name} where ${option}`;
        };
        console.log(str);
        connection.query(str, (error, results, fields) => {
            callback(error, results, fields);
        });
        return this;
    }
};

/**
* @description: 执行sql语句
* @param {String} str : sql语句
* @param {Function} callback :（req,results）=>{}
*/
Model.prototype.sql = function (str, callback) {
    if(!isConnect){
        this.connect(err => {
            isConnect = true;
            connection.query(str, (error, results, fields) => {
                callback(error, results, fields);
            });
            return this;
        });
    } else {
        connection.query(str, (error, results, fields) => {
            callback(error, results, fields);
        });
        return this;
    }
};

/**
* @description: 删除model表格 （慎用！）
* @param {type} 
* @return: 
*/
Model.prototype.drop = function (callback) {
    connection.query(`DROP TABLE ${this.name}`, (error, results, fields) => {
        callback(error, results, fields);
    });
    return this;
};

//连接检测
Model.prototype.connect = function (callback) {
    let p1 = new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                //console.log(err.stack);
                //console.log(err);//42000 数据库不存在  28000账号错误
                //console.log(err.sqlState);//42000 数据库不存在  28000账号错误
                reject(err);
            } else {
                resolve();
            }
        });
    });

    p1.then(() => {
        callback(null);
    }, err => {
        if (err.sqlState == 42000) {
            createDatabase(callback);
        } else if (err.sqlState == 28000) {
            callback('数据库账号或密码错误');
        } else {
            callback(err);
        }
    });
};

//创建数据库
let createDatabase = function (callback) {
    let p2 = new Promise((resolve, reject) => {
        connection = mysql.createConnection({
            host: options.host,//数据库地址
            port: options.port,//端口号
            user: options.user,//用户名，没有可不填
            password: options.password,//密码，没有可不填
        });
        connection.connect((err) => {
            //if (err) throw error;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

    let p3 = new Promise((resolve, reject) => {
        connection.query(`CREATE DATABASE ${options.database}`, (err, results, fields) => {
            //if (error) throw error;
            if (err) {
                reject(err);
            } else {
                resolve();
            }

        });
    });

    let p4 = new Promise((resolve, reject) => {
        connection.query(`use ${options.database}`, (err, results, fields) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

    let pAll = Promise.all([p2, p3, p4]);

    pAll.then(() => {
        callback(null);
    }).catch((err) => {
        callback(err);
    });
}



let orm = {
    /**
    * @description:连接数据库
    * @param {String} host: 主机名 默认localhost
    * @param {Number} port: 端口号 默认3306
    * @param {String} user: 用户名 
    * @param {String} password: 密码 
    * @param {String} database: 数据库名称 默认og
    * @return: 
    */
    connect: function ({ host = 'localhost', port = 3306, user = '', password = '', database = 'og' }) {
        databaseName = database;//全局存储当前数据库名称

        options = {
            host,//数据库地址
            port,//端口号
            user,//用户名，没有可不填
            password,//密码，没有可不填
            database//数据库名称
        };
        connection = mysql.createConnection(options);

    },
    /**
    * @description:创建model (表格模型对象)
    * @param {String} name:表格名称
    * @param {Object} options:表格数据结构
    * @return: Model对象：负责数据库增删改查
    */
    model: function (name, options) {
        let str = 'id int primary key auto_increment, ';
        for (var key in options) {
            if (options[key] == Number) {
                str += `${key} numeric,`;
            } else if (options[key] == Date) {
                str += `${key} timestamp,`;
            } else {
                str += `${key} varchar(255),`;
            }
        };
        str = str.replace(/,$/, '');
        //console.log(`CREATE TABLE ${name} (${str})`);
        //console.log(str);
        tableSQL = `CREATE TABLE ${name} (${str})`;
        return new Model(name, options);
    }
};

orm.connect(orm_config);

module.exports = orm;