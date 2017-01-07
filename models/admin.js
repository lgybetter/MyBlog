var mongodb = require('./db.js');
var crypto = require('crypto');

function Admin(admin) {
	this.name = admin.name;
	this.password = admin.password;
};

module.exports = Admin;

Admin.prototype.save = function (callback) {
	//要存入数据库的管理员文档
	var admin = {
		name: this.name,
		password: this.password,
	};
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);//错误，返回err信息
		}
		db.authenticate('user', 'lgylgy', (err, result) => {
			//读取 admins集合
			db.collection('admins', function (err, collection) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				//将用户数据插入admins集合
				collection.insert(admin, {
					safe: true
				}, function (err, admin) {
					mongodb.close();
					if (err) {
						return callback(err);//错误，返回err信息
					}
					callback(null, admin[0]);//成功 ，err为null，并返回存储后的管理员文档
				});
			});
		})

	});
};


Admin.get = function (name, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);//错误，返回err信息
		}
		db.authenticate('user', 'lgylgy', (err, result) => {
			//读取admins集合
			db.collection('admins', function (err, collection) {
				if (err) {
					mongodb.close();
					return callback(err);//错误，返回err信息
				}
				//查找用户名（name键）值为name的一个文档
				collection.findOne({
					name: name
				}, function (err, admin) {
					mongodb.close();
					if (err) {
						return callback(err);//失败，返回err信息
					}
					callback(null, admin);//成功，返回查询的管理员信息
				});
			});
		})
	});
};